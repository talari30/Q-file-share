import math
import hashlib
import secrets

from typing import List

from .parameters import N, Q_K, TAU

SEED_LENGTH = 32

STREAM256_OUTPUTBYTES = 32

STREAM128_BLOCKBYTES = 168

UNIFORM_NBLOCKS = math.ceil((768 + STREAM128_BLOCKBYTES - 1) / STREAM128_BLOCKBYTES)

GEN_NBLOCKS = math.ceil(
    math.ceil((12 * (N / 8) * (1 << 12)) / Q_K + STREAM128_BLOCKBYTES)
    / STREAM128_BLOCKBYTES
)


def expand_a(seed: bytes, k: int, l: int, q: int) -> List[List[List[int]]]:
    A = [[[] for _ in range(l)] for _ in range(k)]

    for i in range(k):
        base = i << 8
        for j in range(l):
            nonce = base + j
            A[i][j] = get_uniform_polynomial(
                seed, bytes([(nonce >> 8) & 0xFF, nonce & 0xFF]), q
            )

    return A


def expand_a_kyber(seed: bytes, k: int, l: int, q: int) -> list:
    A = [[[] for _ in range(l)] for _ in range(k)]

    for i in range(k):
        for j in range(l):
            A[i][j] = get_uniform_polynomial_kyber(seed, bytes([i, j]), q)

    return A


def get_random_vectors(l: int, n: int) -> List[List[int]]:
    return [[random_int(-n, n + 1) for _ in range(N)] for _ in range(l)]


def generate_poly_buffer(message: bytes, coefficient_bytes: bytes) -> bytes:
    try:
        shake_hash = hashlib.shake_256()
        shake_hash.update(message)
        shake_hash.update(coefficient_bytes)
        return shake_hash.digest(STREAM256_OUTPUTBYTES)
    except Exception as e:
        print(f"Error generating poly buffer: {e}")
        return b""


def get_polynomial_challenge(seed: bytes) -> List[int]:
    shake = hashlib.shake_256()
    shake.update(seed)
    random_bytes = list(shake.digest(STREAM256_OUTPUTBYTES * 8))

    C = [0] * N
    position = 0

    for index_i in range(N - TAU, N):
        index_j = random_bytes[position % N] % (index_i + 1)
        sign = random_bytes[position] & 1
        position += 1

        C[index_i] = C[index_j]
        C[index_j] = (-1) ** sign

    return C


def get_random_seed() -> bytes:
    return secrets.token_bytes(SEED_LENGTH)


def generate_sample_noise_polynomial(eta: int) -> List[int]:
    return [secure_sample_centered_binomial(eta) for _ in range(N)]


def generate_sample_noise_poly_vector(size: int, eta: int) -> List[List[int]]:
    return [generate_sample_noise_polynomial(eta) for _ in range(size)]


def get_uniform_polynomial(seed: bytes, nonce: bytes, q: int) -> List[int]:
    buffer_length = UNIFORM_NBLOCKS * STREAM128_BLOCKBYTES
    shake = hashlib.shake_128()
    shake.update(seed)
    shake.update(nonce)

    buffer = shake.digest(buffer_length)
    return reject_uniform_sampling([0] * N, buffer, buffer_length, q)


def get_uniform_polynomial_kyber(seed: bytes, nonce: bytes, q: int) -> List[int]:
    buffer_length = GEN_NBLOCKS * STREAM128_BLOCKBYTES
    shake = hashlib.shake_128()
    shake.update(seed)
    shake.update(nonce)

    buffer = shake.digest(buffer_length)
    return reject_uniform_sampling_k([0] * N, buffer, buffer_length, q)


def reject_uniform_sampling(
    polynomial: List[List[int]], buffer: bytes, buffer_length: int, q: int
) -> List[int]:
    ctr = 0
    pos = 0

    while ctr < N and pos + 3 <= buffer_length:
        b = buffer[pos] | (buffer[pos + 1] << 8) | (buffer[pos + 2] << 16)
        b &= 0x7FFFFF
        pos += 3

        if b < q:
            polynomial[ctr] = b
            ctr += 1

    return polynomial


def reject_uniform_sampling_k(
    polynomial: List[List[int]], buffer: bytes, buffer_length: int, q: int
) -> List[int]:
    ctr = 0
    pos = 0

    val0 = 0
    val1 = 0

    while ctr < N and pos + 3 <= buffer_length:
        val0 = ((buffer[pos + 0] >> 0) | (buffer[pos + 1] << 8)) & 0xFFF
        val1 = ((buffer[pos + 1] >> 4) | (buffer[pos + 2] << 4)) & 0xFFF
        pos += 3

        if val0 < q:
            polynomial[ctr] = val0
            ctr += 1

        if ctr < N and val1 < q:
            polynomial[ctr] = val1
            ctr += 1

    return polynomial


def random_int(min_val: int, max_val: int) -> int:
    range_val = max_val - min_val
    random_value = secrets.randbelow(range_val)
    return min_val + random_value


def secure_sample_centered_binomial(eta: int) -> int:
    a = [secrets.randbelow(2) for _ in range(eta)]
    b = [secrets.randbelow(2) for _ in range(eta)]

    result = sum(a_i - b_i for a_i, b_i in zip(a, b))
    return result
