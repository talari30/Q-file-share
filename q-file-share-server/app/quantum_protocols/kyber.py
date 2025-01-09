import math

from typing import List

from .parameters import Q_K, K_K, ETA_K

from .generators import (
    expand_a_kyber,
    get_random_seed,
    generate_sample_noise_polynomial,
    generate_sample_noise_poly_vector,
)

from .helpers import (
    add_polynomials,
    add_polynomial_vectors,
    multiply_matrix_poly_vector,
    multiply_poly_vectors,
    subtract_polynomials,
    reduce_coefficients_mod_q,
    reduce_poly_vector,
)


class Kyber:
    def generate_key_pair(self) -> dict:
        seed = get_random_seed()
        A = expand_a_kyber(seed, K_K, K_K, Q_K)

        s = generate_sample_noise_poly_vector(K_K, ETA_K)
        e = generate_sample_noise_poly_vector(K_K, ETA_K)

        t = add_polynomial_vectors(multiply_matrix_poly_vector(A, s, Q_K), e)
        t = [reduce_coefficients_mod_q(polynomial, Q_K) for polynomial in t]

        return {"public_key": {"t": t, "seed": seed}, "secret_key": s}

    def cpa_encrypt(self, t: List[List[int]], seed: bytes) -> dict:
        m1 = get_random_seed()
        m1 = [int(bit) for byte in m1 for bit in f"{byte:08b}"]
        m = [value * math.ceil(Q_K / 2) for value in m1]

        A = expand_a_kyber(seed, K_K, K_K, Q_K)

        r = generate_sample_noise_poly_vector(K_K, ETA_K)
        e1 = generate_sample_noise_poly_vector(K_K, ETA_K)
        e2 = generate_sample_noise_polynomial(ETA_K)

        u = reduce_poly_vector(
            add_polynomial_vectors(multiply_matrix_poly_vector(A, r, Q_K, True), e1),
            Q_K,
        )
        v = reduce_coefficients_mod_q(
            add_polynomials(
                (add_polynomials(multiply_poly_vectors(t, r, Q_K), e2)),
                m,
            ),
            Q_K,
        )

        return {"u": u, "v": v, "key": m1}

    def cpa_decrypt(self, s: List[List[int]], uv: dict) -> list:
        mn = reduce_coefficients_mod_q(
            subtract_polynomials(uv["v"], multiply_poly_vectors(s, uv["u"], Q_K)), Q_K
        )

        ceil_qk = math.ceil(Q_K / 2)
        return [
            (ceil_qk if abs(m - ceil_qk) < min(abs(m), abs(m - Q_K)) else 0) // ceil_qk
            for m in mn
        ]
