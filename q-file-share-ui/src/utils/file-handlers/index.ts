import { Buffer } from "buffer";
import { Cipher, createCipheriv, createDecipheriv, randomBytes } from "crypto";

import {
  INVALID_ENCRYPTION_KEY_ERROR,
  MAX_FILE_BYTES,
  UNTITLED_FILE,
} from "@/constants";
import { IActivity, IListElement } from "@/modules";
import {
  cpaDecrypt,
  DLSecretKey,
  DLSignature,
  generateKyberKeyPair,
  KyberKeyPair,
  signWithDilithium,
} from "@/quantum-protocols";

import axiosInstance from "../api-wrapper";
import { getAuthToken } from "../auth-token";
import { stringifyKyberKeyPair } from "../crystals-helpers";
import { getActivityTypeMessage } from "../string-utils";

export const getFileSize = (fileSize: number) => {
  const sizeInKB = fileSize / 1024;
  return sizeInKB < 1000
    ? `${sizeInKB.toFixed(2)} KB`
    : `${(sizeInKB / 1024).toFixed(2)} MB`;
};

export const getFileActivities = (activities: any[]): IActivity[] =>
  activities?.map((activity: any) => ({
    message: `${getActivityTypeMessage(activity["type"])} ${activity["email"]}`,
    type: activity["type"],
  }));

export const getFileSRDetails = (
  fileDetails: any[],
  transceive: string,
  transactionDate: string,
): IListElement[] =>
  fileDetails?.map((fileDetail: any) => ({
    fileId: fileDetail?.file_id,
    name: fileDetail?.name,
    size: fileDetail?.size,
    expiry: fileDetail?.expiry,
    downloads: fileDetail?.download_count,
    transceive: fileDetail?.[transceive],
    transactionDate: fileDetail?.[transactionDate],
  }));

export const fileDownloadHandler = async (
  fileId: string,
  fileName: string,
): Promise<void> => {
  try {
    const kyberKeyPair: KyberKeyPair = generateKyberKeyPair();
    const response = await axiosInstance.post(
      "/file/download",
      {
        file_id: fileId,
        kyber_key_pair: stringifyKyberKeyPair(kyberKeyPair),
      },
      {
        headers: {
          Authorization: getAuthToken(),
        },
        responseType: "blob",
      },
    );

    const kyberPublicKey = JSON.parse(response.headers["x-array-data"]);
    const kyberSharedKey: number[] = cpaDecrypt(kyberKeyPair.secretKey, [
      kyberPublicKey["u"],
      kyberPublicKey["v"],
    ]);

    decryptAndDownloadFile(
      response?.data,
      kyberSharedKey,
      kyberPublicKey["iv"],
      fileName || UNTITLED_FILE,
    );
  } catch (error: any) {
    throw error;
  }
};

export const signEncryptAndProcessFile = async (
  file: File,
  dlSecretKey: DLSecretKey,
  kyberKey: number[],
): Promise<{
  initVector: string;
  encryptedFileBuffer: Buffer;
  fileSignature?: DLSignature;
  fileName: string;
  fileSize: number;
  fileType: string;
}> => {
  let fileSignature: DLSignature | undefined;

  const fileReadPromise = new Promise<ArrayBuffer>((resolve, reject) => {
    const reader: FileReader = new FileReader();
    reader.onload = (event: ProgressEvent<FileReader>) => {
      if (event.target?.result) {
        resolve(event.target.result as ArrayBuffer);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });

  const arrayBuffer = await fileReadPromise;

  const byteLength: number = Math.min(MAX_FILE_BYTES, arrayBuffer.byteLength);
  fileSignature = signWithDilithium(
    dlSecretKey,
    new Uint8Array(arrayBuffer, 0, byteLength),
  );

  const encryptedData = await encryptFile(file, kyberKey);

  return {
    ...encryptedData,
    fileSignature,
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
  };
};

export const decryptAndDownloadFile = async (
  fileBlob: any,
  key: number[],
  iv: string,
  fileName: string,
): Promise<void> => {
  const arrayBuffer = await fileBlob.arrayBuffer();
  const encryptedFileBuffer = Buffer.from(arrayBuffer);
  const decryptedFileBuffer = await decryptFile(encryptedFileBuffer, key, iv);

  const url: string = window.URL.createObjectURL(
    new Blob([decryptedFileBuffer], { type: "application/octet-stream" }),
  );

  const link: HTMLAnchorElement = document.createElement("a");
  link.href = url;
  link.setAttribute("download", fileName || "untitled_file");

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const encryptFile = async (
  file: File,
  key: number[],
): Promise<{
  initVector: string;
  encryptedFileBuffer: Buffer;
}> => {
  if (key.length !== 256 || !key.every((bit) => bit === 0 || bit === 1)) {
    throw new Error(INVALID_ENCRYPTION_KEY_ERROR);
  }

  const byteKey: Uint8Array = new Uint8Array(
    Array.from({ length: 24 }, (_, i) =>
      parseInt(key.slice(i * 8, i * 8 + 8).join(""), 2),
    ),
  );

  const initVector: Buffer = randomBytes(16);
  const fileContent: ArrayBuffer = await file.arrayBuffer();

  const bufferContent: Buffer = Buffer.from(fileContent);

  const cipher: Cipher = createCipheriv("aes-192-cbc", byteKey, initVector);
  const encryptedFileBuffer: Buffer = Buffer.concat([
    cipher.update(bufferContent),
    cipher.final(),
  ]);

  return {
    initVector: initVector.toString("base64"),
    encryptedFileBuffer,
  };
};

const decryptFile = async (
  encryptedFileBuffer: Buffer,
  key: number[],
  initVectorBase64: string,
): Promise<Buffer> => {
  if (key.length !== 256 || !key.every((bit) => bit === 0 || bit === 1)) {
    throw new Error("Invalid encryption key");
  }

  const byteKey: Uint8Array = new Uint8Array(
    Array.from({ length: 24 }, (_, i) =>
      parseInt(key.slice(i * 8, i * 8 + 8).join(""), 2),
    ),
  );

  const initVector: Buffer = Buffer.from(initVectorBase64, "base64");

  const decipher = createDecipheriv("aes-192-cbc", byteKey, initVector);
  const decryptedFileBuffer: Buffer = Buffer.concat([
    decipher.update(encryptedFileBuffer),
    decipher.final(),
  ]);

  return decryptedFileBuffer;
};
