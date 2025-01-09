import styles from "./SendFileOptions.module.css";

import { FormEvent, useRef } from "react";

import { Button, Input, Loader } from "@/elements";
import {
  DEFAULT_DOWNLOAD_COUNT,
  DEFAULT_EXPIRATION_DAYS,
  DOWNLOAD_COUNT,
  EXPIRATION,
  RECIPIENT_EMAIL,
  SEND_ANONYMOUSLY,
  SHARE,
} from "@/constants";

interface ISendFileOptionsProps {
  handleFileSubmission: (re: string, e: string, d: string, c: boolean) => void;
  isUploading?: boolean;
}

export const SendFileOptions = (props: ISendFileOptionsProps): JSX.Element => {
  const { handleFileSubmission, isUploading = false } = props;

  const recipientEmailRef = useRef<HTMLInputElement>(null);
  const expirationRef = useRef<HTMLInputElement>(null);
  const downloadCountRef = useRef<HTMLInputElement>(null);
  const checkAnonymousRef = useRef<HTMLInputElement>(null);

  const handleSubmission = (event: FormEvent): void => {
    event.preventDefault();

    const recipientEmail: string = recipientEmailRef.current?.value || "";
    const expiration: string =
      expirationRef.current?.value || DEFAULT_EXPIRATION_DAYS.toString();
    const downloadCount: string =
      downloadCountRef.current?.value || DEFAULT_DOWNLOAD_COUNT.toString();
    const checkAnonymous: boolean = checkAnonymousRef.current?.checked || false;

    handleFileSubmission(
      recipientEmail,
      expiration,
      downloadCount,
      checkAnonymous,
    );
  };

  return (
    <form className={styles.formContainer} onSubmit={handleSubmission}>
      <div className={styles.inputContainer}>
        <div className={styles.inputFieldContainer}>
          <Input
            id="recipient-email"
            className={styles.inputElement}
            ref={recipientEmailRef}
            type="email"
            required
            placeholder={RECIPIENT_EMAIL}
          />
          <Input
            id="expiration-days"
            className={styles.inputElement}
            ref={expirationRef}
            type="number"
            required
            placeholder={EXPIRATION}
          />
          <Input
            id="download-count"
            className={styles.inputElement}
            ref={downloadCountRef}
            type="number"
            required
            placeholder={DOWNLOAD_COUNT}
          />
        </div>
        <Input
          id="check-anonymous"
          className={styles.inputElement}
          ref={checkAnonymousRef}
          type="checkbox"
          placeholder={SEND_ANONYMOUSLY}
        />
      </div>
      <Button id="share-button" className={styles.shareButton} type="submit">
        {!isUploading ? SHARE : <Loader />}
      </Button>
    </form>
  );
};
