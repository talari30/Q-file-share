"use client";

import styles from "./SendFile.module.css";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  FILE_UPLOAD_SUCCESSFUL,
  FILE_UPLOAD_UNSUCCESSFUL,
  GENERIC_ERROR_MESSAGE,
  RECEIVED_FILES,
  SHARED_FILES,
} from "@/constants";
import { useNotification } from "@/context";
import { Loader } from "@/elements";
import { NavBar, SendFileOptions, UploadFile } from "@/modules";
import {
  cpaEncrypt,
  DLPublicKey,
  DLSecretKey,
  generateDilithiumKeyPair,
  KyberKey,
} from "@/quantum-protocols";
import {
  axiosInstance,
  getAuthToken,
  isValidToken,
  signEncryptAndProcessFile,
  stringifyDLPublicKey,
  stringifyDLSignature,
  stringifyKyberKey,
} from "@/utils";

const SendFile = (): JSX.Element => {
  const router = useRouter();

  const { addNotification } = useNotification();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [files, setFiles] = useState<File[]>([]);

  const [kyberKey, setKyberKey] = useState<KyberKey>({ u: [], v: [], key: [] });

  useEffect(() => {
    const getKyberKey = async () => {
      if (!isValidToken()) {
        router.replace("/login");
        return;
      }
      try {
        const response = await axiosInstance.get("/file/kyber-key", {
          headers: {
            Authorization: getAuthToken(),
          },
        });
        if (response?.status === 200) {
          const kyberEncryptOutput = cpaEncrypt(
            response.data?.t,
            response?.data?.seed,
          );
          setKyberKey(kyberEncryptOutput);
        }
      } catch (error: any) {
        addNotification({
          message: error?.response?.data?.detail || GENERIC_ERROR_MESSAGE,
          type: "error",
        });
      } finally {
        setIsLoading(false);
      }
    };

    getKyberKey();
  }, []);

  const handleFilesUpload = async (files: File[]) => {
    setFiles(files);
  };

  const handleFileSubmission = async (
    recipientEmail: string,
    expiration: string,
    downloadCount: string,
    checkAnonymous: boolean,
  ) => {
    if (typeof files === "undefined" || files.length === 0) {
      addNotification({ message: "Add atleast 1 file", type: "info" });
      return;
    }

    try {
      setIsUploading(true);
      const dlGenKeyPair: {
        publicKey: DLPublicKey;
        secretKey: DLSecretKey;
      } = generateDilithiumKeyPair();

      const encryptedFilesData = await Promise.all(
        files.map((file: File) =>
          signEncryptAndProcessFile(file, dlGenKeyPair.secretKey, kyberKey.key),
        ),
      );

      const formData: FormData = new FormData();
      encryptedFilesData.forEach((fileData) => {
        if (typeof fileData.fileSignature !== "undefined") {
          formData.append(
            "EncryptedFileBuffers",
            new Blob([fileData.encryptedFileBuffer]),
          );
          formData.append("InitVector", fileData.initVector);
          formData.append("FileNames", fileData.fileName);
          formData.append("FileSizes", fileData.fileSize.toString());
          formData.append("FileTypes", fileData.fileType);
          formData.append(
            "FileSignature",
            stringifyDLSignature(fileData.fileSignature),
          );
        }
      });
      formData.append(
        "DLPublicKey",
        stringifyDLPublicKey(dlGenKeyPair.publicKey),
      );
      formData.append("KyberKey", stringifyKyberKey(kyberKey));
      formData.append("RecipientEmail", recipientEmail);
      formData.append("Expiration", expiration);
      formData.append("DownloadCount", downloadCount);
      formData.append("Anonymous", checkAnonymous.toString());

      const response = await axiosInstance.post("/file/upload", formData, {
        headers: {
          Authorization: getAuthToken(),
          "Content-Type": "multipart/form-data",
        },
      });
      if (response.status === 200) {
        addNotification({ message: FILE_UPLOAD_SUCCESSFUL, type: "success" });
        router.refresh();
      }
    } catch (error: any) {
      addNotification({
        message: error?.response?.data?.detail || FILE_UPLOAD_UNSUCCESSFUL,
        type: "error",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <NavBar
        pageName1={SHARED_FILES}
        pageURL1="/shared-files"
        pageName2={RECEIVED_FILES}
        pageURL2="/received-files"
      />
      <div className={styles.container}>
        {isLoading ? (
          <Loader isStatic />
        ) : (
          <>
            <div className={styles.uploadFile}>
              <UploadFile onUpload={handleFilesUpload} />
            </div>
            <div className={styles.sendFileOptions}>
              <SendFileOptions
                handleFileSubmission={handleFileSubmission}
                isUploading={isUploading}
              />
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default SendFile;
