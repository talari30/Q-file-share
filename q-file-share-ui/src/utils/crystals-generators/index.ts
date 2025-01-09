import { randomBytes } from "crypto";
import { shake128, shake256 } from "js-sha3";

import { Matrix, Polynomial } from "..";

import { N, Q_K, SEED_LENGTH, TAU } from "@/quantum-protocols";

const STREAM256_OUTPUTBITS: number = 256;

const STREAM128_BLOCKBYTES: number = 168;

const UNIFORM_NBLOCKS: number = Math.ceil(
  (768 + STREAM128_BLOCKBYTES - 1) / STREAM128_BLOCKBYTES,
);

const GEN_NBLOCKS = Math.ceil(
  Math.ceil((12 * (N / 8) * (1 << 12)) / Q_K + STREAM128_BLOCKBYTES) /
    STREAM128_BLOCKBYTES,
);

export const expandA = (
  seed: Uint8Array,
  k: number,
  l: number,
  q: number,
): Matrix => {
  const A: Matrix = Array.from({ length: k }, () => Array(l).fill([]));

  for (let i = 0; i < k; i++) {
    const base: number = i << 8;
    for (let j = 0; j < l; j++) {
      const nonce: number = base + j;
      A[i][j] = getUniformPolynomial(
        seed,
        new Uint8Array([nonce >> 8, nonce & 0xff]),
        q,
      );
    }
  }

  return A;
};

export const expandAKyber = (
  seed: Uint8Array,
  k: number,
  l: number,
  q: number,
) => {
  const A: Matrix = Array.from({ length: k }, () => Array(l).fill([]));

  for (let i = 0; i < k; i++) {
    for (let j = 0; j < l; j++) {
      A[i][j] = getUniformPolynomialKyber(seed, new Uint8Array([i, j]), q);
    }
  }

  return A;
};

export const getRandomVectors = (l: number, n: number): Polynomial[] =>
  Array.from({ length: l }, () =>
    Array.from({ length: N }, () => randomInt(-n, n + 1)),
  );

export const generatePolyBuffer = (
  message: Uint8Array,
  coefficientBytes: Uint8Array,
): Uint8Array => {
  const shakeHash = shake256.create(STREAM256_OUTPUTBITS);
  shakeHash.update(message);
  shakeHash.update(coefficientBytes);

  return new Uint8Array(shakeHash.arrayBuffer());
};

export const getPolynomialChallenge = (seed: Uint8Array): number[] => {
  const shakeHash = shake256.create(STREAM256_OUTPUTBITS * 8);
  shakeHash.update(seed);
  const randomBytes: number[] = shakeHash.digest();

  const C: Polynomial = new Array(N).fill(0);

  let position: number = 0;
  for (let indexI = N - TAU; indexI < N; indexI++) {
    let indexJ: number = randomBytes[position % N] % (indexI + 1);
    let sign: number = randomBytes[position++] & 1;

    C[indexI] = C[indexJ];
    C[indexJ] = Math.pow(-1, sign);
  }

  return C;
};

export const getRandomSeed = (): Uint8Array<ArrayBufferLike> => {
  const seed: Uint8Array = new Uint8Array(SEED_LENGTH);
  crypto.getRandomValues(seed);
  return seed;
};

export const generateSampleNoisePolynomial = (eta: number): number[] =>
  Array.from({ length: N }, () => secureSampleCenteredBinomial(eta));

export const generateSampleNoisePolyVector = (
  size: number,
  eta: number,
): number[][] =>
  Array.from({ length: size }, () => generateSampleNoisePolynomial(eta));

const getUniformPolynomial = (
  seed: Uint8Array,
  nonce: Uint8Array,
  q: number,
): Polynomial => {
  const bufferLength: number = UNIFORM_NBLOCKS * STREAM128_BLOCKBYTES;
  const buffer: Uint8Array = new Uint8Array(bufferLength + 2);

  const shakeHash = shake128.create(bufferLength * 8);
  shakeHash.update(seed);
  shakeHash.update(nonce);

  buffer.set(new Uint8Array(shakeHash.arrayBuffer()));
  return rejectUniformSamplingDL(new Array(N).fill(0), buffer, bufferLength, q);
};

const getUniformPolynomialKyber = (
  seed: Uint8Array,
  nonce: Uint8Array,
  q: number,
): Polynomial => {
  const bufferLength: number = GEN_NBLOCKS * STREAM128_BLOCKBYTES;
  const buffer: Uint8Array = new Uint8Array(bufferLength + 2);

  const shakeHash = shake128.create(bufferLength * 8);
  shakeHash.update(seed);
  shakeHash.update(nonce);

  buffer.set(new Uint8Array(shakeHash.arrayBuffer()));
  return rejectUniformSamplingK(new Array(N).fill(0), buffer, bufferLength, q);
};

const rejectUniformSamplingDL = (
  polynomial: Polynomial,
  buffer: Uint8Array,
  bufferLength: number,
  q: number,
): Polynomial => {
  let ctr: number = 0;
  let pos: number = 0;

  let b: number = 0;

  while (ctr < N && pos + 3 <= bufferLength) {
    b = buffer[pos++];
    b |= buffer[pos++] << 8;
    b |= buffer[pos++] << 16;
    b &= 0x7fffff;

    if (b < q) polynomial[ctr++] = b;
  }

  return polynomial;
};

const rejectUniformSamplingK = (
  polynomial: Polynomial,
  buffer: Uint8Array,
  bufferLength: number,
  q: number,
): Polynomial => {
  let ctr: number = 0;
  let pos: number = 0;

  let val0: number = 0;
  let val1: number = 0;

  while (ctr < N && pos + 3 <= bufferLength) {
    val0 = ((buffer[pos + 0] >> 0) | (buffer[pos + 1] << 8)) & 0xfff;
    val1 = ((buffer[pos + 1] >> 4) | (buffer[pos + 2] << 4)) & 0xfff;
    pos += 3;

    if (val0 < q) polynomial[ctr++] = val0;

    if (ctr < N && val1 < Q_K) polynomial[ctr++] = val1;
  }

  return polynomial;
};

const randomInt = (min: number, max: number): number => {
  if (typeof window !== "undefined" && window.crypto) {
    const range = max - min;
    const randomBuffer = new Uint32Array(1);
    window.crypto.getRandomValues(randomBuffer);
    return min + (randomBuffer[0] % range);
  } else if (typeof require !== "undefined") {
    const crypto = require("crypto");
    return crypto.randomInt(min, max);
  } else {
    return Math.floor(Math.random() * (max - min)) + min;
  }
};

const secureSampleCenteredBinomial = (eta: number): number => {
  const a: number[] = Array.from({ length: eta }, () => randomBytes(1)[0] % 2);
  const b: number[] = Array.from({ length: eta }, () => randomBytes(1)[0] % 2);

  return a.reduce((sum, ai, index) => sum + (ai - b[index]), 0);
};
