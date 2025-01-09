import { modPlus, modSymmetric } from ".";

import { N, Q_K } from "@/quantum-protocols";

export type Polynomial = number[];

export type Matrix = Polynomial[][];

export const addPolynomialVectors = (
  polyVector1: Polynomial[],
  polyVector2: Polynomial[],
): Polynomial[] =>
  polyVector1.map((polynomial: Polynomial, index: number) =>
    addPolynomials(polynomial, polyVector2[index]),
  );

export const subtractPolynomialVectors = (
  polyVector1: Polynomial[],
  polyVector2: Polynomial[],
): Polynomial[] =>
  polyVector1.map((polynomial: Polynomial, index: number) =>
    subtractPolynomials(polynomial, polyVector2[index]),
  );

export const multiplyPolynomialWithPolyVector = (
  polynomial: Polynomial,
  polyVector: Polynomial[],
  q: number,
): Polynomial[] =>
  polyVector.map((poly: Polynomial) =>
    reduceCoefficientsModQ(
      reducedPolynomialsMultiplication(poly, polynomial),
      q,
    ),
  );

export const multiplyPolyVectors = (
  polyVector1: Polynomial[],
  polyVector2: Polynomial[],
  q: number,
): Polynomial => {
  let resultPolynomial: Polynomial = new Array(N).fill(0);

  if (polyVector1.length !== polyVector2.length)
    throw new Error("Polynomial vectors must have the same length");

  for (let i = 0; i < polyVector1.length; i++) {
    const polyProduct: Polynomial = reducedPolynomialsMultiplication(
      polyVector1[i],
      polyVector2[i],
    );
    resultPolynomial = reduceCoefficientsModQ(
      addPolynomials(resultPolynomial, polyProduct),
      q,
    );
  }

  return resultPolynomial;
};

export const multiplyMatrixPolyVector = (
  matrix: Matrix,
  polyVector: Polynomial[],
  q: number,
  transpose?: boolean,
) => {
  const isTranspose: boolean = typeof transpose !== "undefined" && transpose;

  const resPolynomial: Polynomial[] = [];
  for (let i = 0; i < matrix.length; i++) {
    let rowResult: Polynomial = reducedPolynomialsMultiplication(
      polyVector[0],
      isTranspose ? matrix[0][i] : matrix[i][0],
    );
    for (let j = 1; j < matrix?.[0].length; j++) {
      const multipliedPolynomial: Polynomial = reducedPolynomialsMultiplication(
        polyVector[j],
        isTranspose ? matrix[j][i] : matrix[i][j],
      );
      rowResult = reduceCoefficientsModQ(
        addPolynomials(rowResult, multipliedPolynomial),
        q,
      );
    }
    resPolynomial.push(rowResult);
  }

  return resPolynomial;
};

export const reducePolyVector = (
  polyVector: Polynomial[],
  q: number,
): Polynomial[] =>
  polyVector?.map((polynomial: Polynomial) =>
    reduceCoefficientsModQ(polynomial, q),
  );

export const reducePolyVectorSymmetric = (
  polyVector: Polynomial[],
  q: number,
): Polynomial[] =>
  polyVector?.map((polynomial: Polynomial) =>
    reduceCoefficientsSymModQ(polynomial, q),
  );

export const encodePolynomialCoefficients = (
  polynomial: Polynomial,
): Uint8Array =>
  new Uint8Array(
    Array.from(
      { length: N / 2 },
      (_, i) => polynomial[2 * i] + polynomial[2 * i + 1] * 16,
    ),
  );

export const addPolynomials = (
  polynomial1: number[],
  polynomial2: number[],
): number[] => {
  const maxLength: number = Math.max(polynomial1.length, polynomial2.length);

  const p1: Polynomial = [
    ...polynomial1,
    ...new Array(maxLength - polynomial1.length).fill(0),
  ];
  const p2: Polynomial = [
    ...polynomial2,
    ...new Array(maxLength - polynomial2.length).fill(0),
  ];

  return p1.map(
    (coefficient: number, index: number) => coefficient + p2[index],
  );
};

export const subtractPolynomials = (
  polynomial1: number[],
  polynomial2: number[],
): number[] => {
  const maxLength: number = Math.max(polynomial1.length, polynomial2.length);

  const p1: Polynomial = [
    ...polynomial1,
    ...new Array(maxLength - polynomial1.length).fill(0),
  ];
  const p2: Polynomial = [
    ...polynomial2,
    ...new Array(maxLength - polynomial2.length).fill(0),
  ];

  return p1.map(
    (coefficient: number, index: number) => coefficient - p2[index],
  );
};

export const reduceCoefficientsModQ = (
  polynomial: Polynomial,
  q: number,
): Polynomial =>
  polynomial.map((coefficient: number) => modPlus(coefficient, q));

export const reduceCoefficientsSymModQ = (
  polynomial: Polynomial,
  q: number,
): Polynomial =>
  polynomial.map((coefficient: number) => modSymmetric(coefficient, q));

const multiplyPolynomials = (
  polynomial1: number[],
  polynomial2: number[],
): number[] => {
  const maxDegree: number = Math.max(polynomial1.length, polynomial2.length);

  if (maxDegree === 1) return [polynomial1[0] * polynomial2[0]];

  const half: number = Math.ceil(maxDegree / 2);
  const A0: Polynomial = polynomial1.slice(0, half);
  const A1: Polynomial = polynomial1.slice(half);
  const B0: Polynomial = polynomial2.slice(0, half);
  const B1: Polynomial = polynomial2.slice(half);

  const C0: Polynomial = multiplyPolynomials(A0, B0);
  const C2: Polynomial = multiplyPolynomials(A1, B1);
  const C1: Polynomial = multiplyPolynomials(
    addPolynomials(A0, A1),
    addPolynomials(B0, B1),
  );

  const middle: Polynomial = subtractPolynomials(
    subtractPolynomials(C1, C0),
    C2,
  );
  const result: Polynomial = new Array(2 * maxDegree - 1).fill(0);

  for (let i = 0; i < C0.length; i++) result[i] += C0[i];
  for (let i = 0; i < middle.length; i++) result[i + half] += middle[i];
  for (let i = 0; i < C2.length; i++) result[i + 2 * half] += C2[i];

  return result;
};

const polynomialRingReduction = (polynomial: Polynomial): number[] => {
  const reducedPolynomial: Polynomial = new Array(N).fill(0);
  const degree: number = polynomial.length - 1;

  polynomial.forEach((coeff, i) => {
    const index = (degree - i) % N;
    if (Math.floor((degree - i) / N) % 2 === 0) {
      reducedPolynomial[index] += coeff;
    } else {
      reducedPolynomial[index] -= coeff;
    }
  });

  return reducedPolynomial.reverse();
};

const reducedPolynomialsMultiplication = (
  polynomial1: Polynomial,
  polynomial2: Polynomial,
): number[] =>
  polynomialRingReduction(multiplyPolynomials(polynomial1, polynomial2));
