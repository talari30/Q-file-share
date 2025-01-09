import {
  DLPublicKey,
  DLSignature,
  KyberKey,
  KyberKeyPair,
  Q,
} from "@/quantum-protocols";

export * from "./polynomial-helpers";

export const modPlus = (r: number, alpha: number): number =>
  ((r % alpha) + alpha) % alpha;

export const modSymmetric = (r: number, alpha: number): number =>
  ((r + (alpha % 2 === 0 ? alpha / 2 : (alpha - 1) / 2)) % alpha) -
  (alpha % 2 === 0 ? alpha / 2 : (alpha - 1) / 2);

export const power2Round = (r: number, d: number): [number, number] => {
  r = modPlus(r, Q);
  const pow2d: number = Math.pow(2, d);
  const r0 = modSymmetric(r, pow2d);
  return [(r - r0) / pow2d, r0];
};

export const decompose = (r: number, alpha: number): [number, number] => {
  r = modPlus(r, Q);
  const r0: number = modSymmetric(r, alpha);
  if (r - r0 === Q - 1) {
    return [0, r0 - 1];
  }
  return [(r - r0) / alpha, r0];
};

export const highBits = (r: number, alpha: number): number =>
  decompose(r, alpha)[0];

export const lowBits = (r: number, alpha: number): number =>
  decompose(r, alpha)[1];

export const hexToByte = (hex: string): Uint8Array => {
  const sanitizedHex: string = hex.replace(/^0x/i, "");
  const hexLength: number = sanitizedHex.length;

  if (hexLength % 2 !== 0) {
    throw new Error("Invalid Hex for Byte conversion");
  }

  const byteArray: Uint8Array = new Uint8Array(hexLength / 2);
  for (let i = 0; i < hexLength; i += 2) {
    byteArray[i / 2] = parseInt(sanitizedHex.slice(i, i + 2), 16);
  }

  return byteArray;
};

export const modularMultiplication = (
  a: number,
  b: number,
  mod: number,
): number => {
  let result: number = 0;
  a = a % mod;

  while (b > 0) {
    if ((b & 1) > 0) {
      result = (result + a) % mod;
    }
    a = (2 * a) % mod;
    b = b >> 1;
  }
  return result;
};

export const modularExponentiation = (
  x: number,
  y: number,
  p: number,
): number => {
  let result: number = 1;
  x = x % p;
  if (x == 0) return 0;

  while (y > 0) {
    if (y & 1) result = (result * x) % p;
    y = y >> 1;
    x = (x * x) % p;
  }
  return result;
};

export const serializeUint8Array = (array: Uint8Array): string =>
  Buffer.from(array).toString("base64");

export const deserializeToUint8Array = (base64: string): Uint8Array => {
  const binaryString: string = atob(base64);
  return Uint8Array.from(binaryString, (char) => char.charCodeAt(0));
};

export const uint8ArrayToBitArray = (byteArray: Uint8Array): number[] => {
  if (byteArray.length !== 32)
    throw new Error("Input must be a Uint8Array of size 32.");

  return Array.from(byteArray).flatMap((byte) =>
    Array.from({ length: 8 }, (_, i) => (byte >> (7 - i)) & 1),
  );
};

export const stringifyDLSignature = (dlSignature: DLSignature): string =>
  JSON.stringify({
    z: dlSignature.z,
    cp: serializeUint8Array(dlSignature.cp),
  });

export const stringifyDLPublicKey = (dlPublicKey: DLPublicKey): string =>
  JSON.stringify(dlPublicKey);

export const stringifyKyberKey = (kyberKey: KyberKey): string =>
  JSON.stringify({
    u: kyberKey.u,
    v: kyberKey.v,
  });

export const stringifyKyberKeyPair = (kyberKeyPair: KyberKeyPair): string =>
  JSON.stringify({
    t: kyberKeyPair.publicKey.t,
    seed: serializeUint8Array(kyberKeyPair.publicKey.seed),
  });
