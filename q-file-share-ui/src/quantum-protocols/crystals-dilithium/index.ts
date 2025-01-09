import { BETA, ETA, GAMMA1, GAMMA2, k, l, Q, SEED_LENGTH } from "../parameters";

import {
  addPolynomialVectors,
  encodePolynomialCoefficients,
  expandA,
  generatePolyBuffer,
  getPolynomialChallenge,
  getRandomSeed,
  getRandomVectors,
  highBits,
  lowBits,
  multiplyMatrixPolyVector,
  multiplyPolynomialWithPolyVector,
  reducePolyVector,
  reducePolyVectorSymmetric,
  subtractPolynomialVectors,
  Matrix,
  Polynomial,
} from "@/utils";

export type DLPublicKey = [Matrix, Polynomial[]];

export type DLSecretKey = [Matrix, Polynomial[], Polynomial[], Polynomial[]];

export interface DLSignature {
  z: Polynomial[];
  cp: Uint8Array;
}

export const generateDilithiumKeyPair = (): {
  publicKey: DLPublicKey;
  secretKey: DLSecretKey;
} => {
  const seed: Uint8Array = getRandomSeed();

  const A: Matrix = expandA(seed, k, l, Q);

  const s1: Polynomial[] = getRandomVectors(l, ETA);
  const s2: Polynomial[] = getRandomVectors(k, ETA);

  const t: Polynomial[] = reducePolyVector(
    addPolynomialVectors(multiplyMatrixPolyVector(A, s1, Q), s2),
    Q,
  );

  return { publicKey: [A, t], secretKey: [A, t, s1, s2] };
};

export const signWithDilithium = (
  secretKey: DLSecretKey,
  message: Uint8Array,
): DLSignature => {
  let z: Polynomial[] | undefined = undefined;
  let cp: Uint8Array = new Uint8Array(SEED_LENGTH);

  const A: Matrix = secretKey?.[0];

  while (typeof z === "undefined") {
    const y: Polynomial[] = getRandomVectors(l, GAMMA1 - 1);
    const Ay: Polynomial[] = multiplyMatrixPolyVector(A, y, Q);

    const w1: Polynomial[] = Ay.map((polynomial: Polynomial) =>
      polynomial.map((coefficient: number) =>
        highBits(coefficient, 2 * GAMMA2),
      ),
    );

    cp.set(
      generatePolyBuffer(
        message,
        new Uint8Array(
          w1.flatMap((polynomial: Polynomial) =>
            Array.from(encodePolynomialCoefficients(polynomial)),
          ),
        ),
      ),
    );

    const c: Polynomial = getPolynomialChallenge(cp);

    z = reducePolyVectorSymmetric(
      addPolynomialVectors(
        y,
        multiplyPolynomialWithPolyVector(c, secretKey?.[2], Q),
      ),
      Q,
    );

    const v1: boolean = z.some(
      (polynomial: Polynomial) => Math.max(...polynomial) >= GAMMA1 - BETA,
    );
    const v2: boolean = subtractPolynomialVectors(
      Ay,
      multiplyPolynomialWithPolyVector(c, secretKey?.[3], Q),
    )
      .map((polynomial: Polynomial) =>
        polynomial.map((coefficient: number) =>
          lowBits(coefficient, 2 * GAMMA2),
        ),
      )
      .some(
        (polynomial: Polynomial) => Math.max(...polynomial) >= GAMMA2 - BETA,
      );

    if (v1 || v2) z = undefined;
  }
  return { z, cp };
};

export const verifyDilthiumSignature = (
  message: Uint8Array,
  signature: DLSignature,
  publicKey: DLPublicKey,
): boolean => {
  const A: Matrix = publicKey?.[0];
  const t: Polynomial[] = publicKey?.[1];
  const z: Polynomial[] = signature?.z;
  const cp: Uint8Array = signature?.cp;

  const c: Polynomial = getPolynomialChallenge(cp);

  const w1: Polynomial[] = subtractPolynomialVectors(
    multiplyMatrixPolyVector(A, z, Q),
    multiplyPolynomialWithPolyVector(c, t, Q),
  ).map((polynomial: Polynomial) =>
    polynomial.map((coefficient: number) => highBits(coefficient, 2 * GAMMA2)),
  );

  const cp_v: Uint8Array = generatePolyBuffer(
    message,
    new Uint8Array(
      w1.flatMap((polynomial: Polynomial) =>
        Array.from(encodePolynomialCoefficients(polynomial)),
      ),
    ),
  );

  return (
    z.some(
      (polynomial: Polynomial) => Math.max(...polynomial) < GAMMA1 - BETA,
    ) &&
    cp_v.length === cp.length &&
    cp_v.every((value, index) => value === cp[index])
  );
};
