import { ETA_K, k_k, Q_K, SEED_LENGTH } from "../parameters";

import {
  addPolynomials,
  addPolynomialVectors,
  deserializeToUint8Array,
  expandAKyber,
  generateSampleNoisePolynomial,
  generateSampleNoisePolyVector,
  getRandomSeed,
  Matrix,
  multiplyMatrixPolyVector,
  multiplyPolyVectors,
  Polynomial,
  reduceCoefficientsModQ,
  reducePolyVector,
  subtractPolynomials,
  uint8ArrayToBitArray,
} from "@/utils";

export interface KyberKeyPair {
  publicKey: {
    t: Polynomial[];
    seed: Uint8Array;
  };
  secretKey: Polynomial[];
}

export interface KyberKey {
  u: Polynomial[];
  v: Polynomial;
  key: number[];
}

export const generateKyberKeyPair = (): KyberKeyPair => {
  const seed: Uint8Array = getRandomSeed();
  const A: Matrix = expandAKyber(seed, k_k, k_k, Q_K);

  const s = generateSampleNoisePolyVector(k_k, ETA_K);
  const e = generateSampleNoisePolyVector(k_k, ETA_K);

  let t = addPolynomialVectors(multiplyMatrixPolyVector(A, s, Q_K), e);
  t = t.map((polynomial) => reduceCoefficientsModQ(polynomial, Q_K));

  return {
    publicKey: { t, seed },
    secretKey: s,
  };
};

export const cpaEncrypt = (t: Polynomial[], seedString: string): KyberKey => {
  const m1: number[] = uint8ArrayToBitArray(getRandomSeed());
  const m: Polynomial = m1.map((value: number) => value * Math.ceil(Q_K / 2));

  const seed: Uint8Array = deserializeToUint8Array(seedString);
  const A: Matrix = expandAKyber(seed, k_k, k_k, Q_K);

  const r: Polynomial[] = generateSampleNoisePolyVector(k_k, ETA_K);
  const e1: Polynomial[] = generateSampleNoisePolyVector(k_k, ETA_K);
  const e2: Polynomial = generateSampleNoisePolynomial(ETA_K);

  const u: Polynomial[] = reducePolyVector(
    addPolynomialVectors(multiplyMatrixPolyVector(A, r, Q_K, true), e1),
    Q_K,
  );

  const v: Polynomial = reduceCoefficientsModQ(
    addPolynomials(addPolynomials(multiplyPolyVectors(t, r, Q_K), e2), m),
    Q_K,
  );

  return { u, v, key: m1 };
};

export const cpaDecrypt = (
  s: Polynomial[],
  uv: [Polynomial[], Polynomial],
): number[] => {
  const mn: Polynomial = reduceCoefficientsModQ(
    subtractPolynomials(uv[1], multiplyPolyVectors(s, uv[0], Q_K)),
    Q_K,
  );

  const ceilQK: number = Math.ceil(Q_K / 2);
  return mn.map((m) =>
    Math.abs(m - ceilQK) < Math.min(Math.abs(m), Math.abs(m - Q_K))
      ? Math.floor(ceilQK / ceilQK)
      : 0,
  );
};
