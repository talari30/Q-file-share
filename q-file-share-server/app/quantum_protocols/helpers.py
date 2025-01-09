import numpy as np

from typing import List, Tuple

from .parameters import N, Q, Q_K


def mod_plus(r: int, alpha: int) -> int:
    return ((r % alpha) + alpha) % alpha


def mod_symmetric(r: int, alpha: int) -> int:
    offset = alpha // 2 if alpha % 2 == 0 else (alpha - 1) // 2
    return ((r + offset) % alpha) - offset


def decompose(r: int, alpha: int) -> Tuple[int, int]:
    r = mod_plus(r, Q)
    r0 = mod_symmetric(r, alpha)
    if r - r0 == Q - 1:
        return (0, r0 - 1)
    return ((r - r0) // alpha, r0)


def high_bits(r: int, alpha: int) -> int:
    return decompose(r, alpha)[0]


def compress_poly_QK(polynomial: List[int]) -> List[int]:
    compressed_poly = [0] * (N // 2)
    t_byte = [0] * 8
    for i in range(N // 8):
        for j in range(8):
            u = polynomial[8 * i + j]
            u += (u >> 15) & Q_K
            d0 = u << 4
            d0 += 1665
            d0 *= 80635
            d0 >>= 28
            t_byte[j] += d0 & 0xF
        compressed_poly[i] = t_byte[0] | (t_byte[1] << 4)
        compressed_poly[i + 1] = t_byte[2] | (t_byte[3] << 4)
        compressed_poly[i + 2] = t_byte[4] | (t_byte[5] << 4)
        compressed_poly[i + 3] = t_byte[6] | (t_byte[7] << 4)

    return compressed_poly


def decompress_poly_QK(compressed_poly: List[int]) -> List[int]:
    polynomial = [0] * N
    for i in range(N // 2):
        polynomial[2 * i] = (((compressed_poly[i] & 15) * Q_K) + 8) >> 4
        polynomial[2 * i + 1] = (((compressed_poly[i] >> 4) * Q_K) + 8) >> 4

    return polynomial


def add_polynomial_vectors(
    poly_vector1: List[List[int]], poly_vector2: List[List[int]]
) -> List[List[int]]:
    return [
        add_polynomials(poly_vector1[i], poly_vector2[i])
        for i in range(len(poly_vector1))
    ]


def subtract_polynomial_vectors(
    poly_vector1: List[List[int]], poly_vector2: List[List[int]]
) -> List[List[int]]:
    return [
        subtract_polynomials(poly_vector1[i], poly_vector2[i])
        for i in range(len(poly_vector1))
    ]


def multiply_polynomial_with_poly_vector(
    polynomial: List[int], poly_vector: List[List[int]], q: int
) -> List[List[int]]:
    return [
        reduced_polynomials_multiplication(poly, polynomial) for poly in poly_vector
    ]


def multiply_poly_vectors(
    poly_vector1: List[List[int]], poly_vector2: List[List[int]], q: int
) -> List[List[int]]:
    result_polynomial: List[int] = [0] * 4

    for p1, p2 in zip(poly_vector1, poly_vector2):
        poly_product = reduced_polynomials_multiplication(p1, p2)
        result_polynomial = reduce_coefficients_mod_q(
            add_polynomials(result_polynomial, poly_product), q
        )

    return result_polynomial


def multiply_matrix_poly_vector(matrix, poly_vector, q, transpose=False):
    res_polynomial = []
    for i in range(len(matrix)):
        row_result = reduced_polynomials_multiplication(
            poly_vector[0], matrix[0][i] if transpose else matrix[i][0]
        )
        for j in range(1, len(matrix[0])):
            multiplied_polynomial = reduced_polynomials_multiplication(
                poly_vector[j], matrix[j][i] if transpose else matrix[i][j]
            )
            row_result = reduce_coefficients_mod_q(
                add_polynomials(row_result, multiplied_polynomial), q
            )
        res_polynomial.append(row_result)
    return res_polynomial


def reduce_poly_vector(poly_vector, q):
    return [reduce_coefficients_mod_q(polynomial, q) for polynomial in poly_vector]


def reduce_poly_vector_symmetric(poly_vector, q):
    return [reduce_coefficients_sym_mod_q(polynomial, q) for polynomial in poly_vector]


def encode_polynomial_coefficients(polynomial: List[int], N: int) -> np.ndarray:
    return np.array(
        [polynomial[2 * i] + polynomial[2 * i + 1] * 16 for i in range(N // 2)],
        dtype=np.uint8,
    )


def add_polynomials(polynomial1: List[int], polynomial2: List[int]) -> List[int]:
    max_length = max(len(polynomial1), len(polynomial2))
    p1 = polynomial1 + [0] * (max_length - len(polynomial1))
    p2 = polynomial2 + [0] * (max_length - len(polynomial2))
    return [p1[i] + p2[i] for i in range(max_length)]


def subtract_polynomials(polynomial1: List[int], polynomial2: List[int]) -> List[int]:
    max_length = max(len(polynomial1), len(polynomial2))
    p1 = polynomial1 + [0] * (max_length - len(polynomial1))
    p2 = polynomial2 + [0] * (max_length - len(polynomial2))
    return [p1[i] - p2[i] for i in range(max_length)]


def reduce_coefficients_mod_q(polynomial: List[int], q: int) -> List[int]:
    return [mod_plus(c, q) for c in polynomial]


def reduce_coefficients_sym_mod_q(polynomial: List[int], q: int) -> List[int]:
    return [mod_symmetric(c, q) for c in polynomial]


def multiply_polynomials(polynomial1: List[int], polynomial2: List[int]) -> List[int]:
    max_degree = max(len(polynomial1), len(polynomial2))
    if max_degree == 1:
        return [polynomial1[0] * polynomial2[0]]

    half = (max_degree + 1) // 2
    A0, A1 = polynomial1[:half], polynomial1[half:]
    B0, B1 = polynomial2[:half], polynomial2[half:]

    C0 = multiply_polynomials(A0, B0)
    C2 = multiply_polynomials(A1, B1)
    C1 = multiply_polynomials(add_polynomials(A0, A1), add_polynomials(B0, B1))

    middle = subtract_polynomials(subtract_polynomials(C1, C0), C2)
    result = [0] * (2 * max_degree - 1)

    for i in range(len(C0)):
        result[i] += C0[i]
    for i in range(len(middle)):
        result[i + half] += middle[i]
    for i in range(len(C2)):
        result[i + 2 * half] += C2[i]

    return result


def polynomial_ring_reduction(polynomial: List[int]) -> List[int]:
    reduced_poly = [0] * N
    degree = len(polynomial) - 1

    for i, coeff in enumerate(polynomial):
        index = (degree - i) % N
        if ((degree - i) // N) % 2 == 0:
            reduced_poly[index] += coeff
        else:
            reduced_poly[index] -= coeff

    return reduced_poly[::-1]


def reduced_polynomials_multiplication(polynomial1: List[int], polynomial2: List[int]):
    return polynomial_ring_reduction(multiply_polynomials(polynomial1, polynomial2))
