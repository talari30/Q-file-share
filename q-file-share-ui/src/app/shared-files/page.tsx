"use client";

import styles from "./sharedFiles.module.css";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  DOWNLOAD_FAILED,
  GENERIC_ERROR_MESSAGE,
  RECEIVED_FILES,
  SEND_FILES,
  SESSION_EXPIRED_MESSAGE,
  SHARED_FILES,
} from "@/constants";
import { useNotification } from "@/context";
import { Loader } from "@/elements";
import { IListElement, ListHeader, ListModule, NavBar } from "@/modules";
import {
  axiosInstance,
  fileDownloadHandler,
  getAuthToken,
  getFileSRDetails,
  isValidToken,
  removeAuthToken,
} from "@/utils";

const SharedFiles = (): JSX.Element => {
  const router = useRouter();

  const { addNotification } = useNotification();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [sharedFiles, setSharedFiles] = useState<IListElement[]>([]);

  useEffect(() => {
    const getSharedFiles = async (): Promise<void> => {
      if (!isValidToken()) {
        await router.replace("/login");
        return;
      }

      try {
        const response = await axiosInstance.get("/file/shared-files", {
          headers: {
            Authorization: getAuthToken(),
          },
        });
        if (response?.status === 200) {
          const fileDetails: IListElement[] = getFileSRDetails(
            response.data?.sharedFiles,
            "sent_to",
            "sent_on",
          );
          if (typeof fileDetails !== "undefined") setSharedFiles(fileDetails);
        }
      } catch (error: any) {
        if (error?.response?.status === 401) {
          addNotification({ message: SESSION_EXPIRED_MESSAGE, type: "warn" });
          removeAuthToken();
          await router.replace("/login");
        } else {
          setSharedFiles([]);
          addNotification({
            type: "error",
            message: error?.response?.data?.detail || GENERIC_ERROR_MESSAGE,
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    getSharedFiles();
  }, []);

  const handleFileDownload = async (
    fileId: string,
    fileName?: string,
  ): Promise<void> => {
    try {
      await fileDownloadHandler(fileId, fileName || "");
    } catch (error: any) {
      addNotification({
        message: error?.response?.data?.detail || DOWNLOAD_FAILED,
        type: "error",
      });
    }
  };

  return (
    <div className={styles.container}>
      <NavBar
        pageName1={SEND_FILES}
        pageName2={RECEIVED_FILES}
        pageURL1="/send-files"
        pageURL2="/received-files"
      />
      <div className={styles.listContainer}>
        {isLoading ? (
          <Loader isStatic />
        ) : (
          <>
            <ListHeader title={SHARED_FILES} />
            <ListModule
              elements={sharedFiles}
              renderSendFilesLayout
              fileDownloadHandler={handleFileDownload}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default SharedFiles;
