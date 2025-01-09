import styles from "./UploadFile.module.css";
import cx from "classnames";

import Image from "next/image";
import { useRef, useState } from "react";

import {
  FILE_UPLOAD_WARN,
  MAX_FILES_COUNT,
  PLACEHOLDER,
  UPLOAD_FILES_TEXT,
} from "@/constants";
import { useNotification } from "@/context";
import { Text } from "@/elements";
import { getFileSize } from "@/utils";

import closeIcon from "@/assets/close-icon.svg";
import fileCheckIcon from "@/assets/file-check.svg";
import fileUploadIcon from "@/assets/file-upload.svg";

interface IUploadFileProps {
  onUpload: (files: File[]) => void;
}

export const UploadFile = (props: IUploadFileProps): JSX.Element => {
  const { onUpload } = props;

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { addNotification } = useNotification();

  const [dragActive, setDragActive] = useState<boolean>(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const processFiles = (files: File[]): void => {
    const totalFiles: number = uploadedFiles.length + files.length;

    if (totalFiles > MAX_FILES_COUNT) {
      addNotification({
        type: "warn",
        message: FILE_UPLOAD_WARN.replace(
          PLACEHOLDER,
          MAX_FILES_COUNT.toString(),
        ),
      });
      return;
    }

    const currentFiles: File[] = uploadedFiles;
    setUploadedFiles((prevFiles: File[]) => [...prevFiles, ...files]);
    onUpload([...currentFiles, ...files]);
  };

  const handleRemoveFile = (
    event: React.MouseEvent,
    fileIndex: number,
  ): void => {
    event.stopPropagation();
    setUploadedFiles((prevFiles: File[]) =>
      prevFiles.filter((_, index: number) => index !== fileIndex),
    );
  };

  const handleDrag = (event: React.DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    event.stopPropagation();
    if (event.type === "dragenter" || event.type === "dragover") {
      setDragActive(true);
    } else if (event.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);

    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      const files = Array.from(event.dataTransfer?.files);
      processFiles(files);
      event.dataTransfer?.clearData();
    }
  };

  const handleFileSelect = (
    event: React.ChangeEvent<HTMLInputElement>,
  ): void => {
    if (event?.target?.files) {
      const files = Array.from(event.target.files);
      processFiles(files);
    }
  };

  const handleClick = (): void => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div
      className={cx(styles.container, `${dragActive ? styles.active : ""}`)}
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        type="file"
        ref={fileInputRef}
        multiple
        className={styles.fileInput}
        onChange={handleFileSelect}
      />
      <div className={styles.iconContainer}>
        <Image
          src={fileUploadIcon}
          className={styles.fileIcon}
          priority
          alt={"file-icon"}
          width={100}
          height={100}
        />
      </div>
      <Text>{UPLOAD_FILES_TEXT}</Text>
      {uploadedFiles.length > 0 && (
        <div className={styles.uploadedFiles}>
          <ul>
            {uploadedFiles.map((file: File, index: number) => (
              <li key={index}>
                <div className={styles.fileContainer}>
                  <Image
                    src={fileCheckIcon}
                    className={styles.fileCheckIcon}
                    alt="file-upload-check"
                    width={20}
                    height={20}
                  />
                  <Text>
                    {file.name} - {getFileSize(file.size)}
                  </Text>
                  <Image
                    src={closeIcon}
                    alt="remove-file"
                    width={20}
                    height={20}
                    onClick={(event: React.MouseEvent) =>
                      handleRemoveFile(event, index)
                    }
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
