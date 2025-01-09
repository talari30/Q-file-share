import styles from "./SignUpForm.module.css";
import cx from "classnames";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useRef, useState } from "react";

import {
  ALREADY_JOINED,
  CONFIRM_PASSWORD,
  EMAIL,
  LOGIN,
  NAME,
  PASSWORD,
  SIGN_UP,
} from "@/constants";
import { Button, Input, Loader, Text } from "@/elements";

import eyeShow from "@/assets/eye-show.svg";
import eyeHide from "@/assets/eye-hide.svg";

interface ISignUpFormProps {
  displayLoader: boolean;
  handleSignUpSubmission: (
    n: string | undefined,
    e: string | undefined,
    p: string | undefined,
    cp: string | undefined,
  ) => void;
}

export const SignUpForm = (props: ISignUpFormProps): JSX.Element => {
  const { displayLoader = false, handleSignUpSubmission } = props;

  const router = useRouter();

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState<boolean>(false);

  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);

  const handleSignUpFormSubmission = (event: FormEvent): void => {
    event.preventDefault();

    const name: string | undefined = nameRef.current?.value;
    const email: string | undefined = emailRef.current?.value;
    const password: string | undefined = passwordRef.current?.value;
    const confirmPassword: string | undefined =
      confirmPasswordRef.current?.value;

    handleSignUpSubmission(name, email, password, confirmPassword);
  };

  return (
    <form className={styles.signUpForm} onSubmit={handleSignUpFormSubmission}>
      <div className={cx(styles.name, styles.signUpFormElement)}>
        <Input
          id="first-name"
          ref={nameRef}
          type="text"
          required
          placeholder={NAME}
        />
      </div>
      <div className={styles.signUpFormElement}>
        <Input
          id="email"
          ref={emailRef}
          type="email"
          required
          placeholder={EMAIL}
        />
      </div>
      <div className={cx(styles.signUpFormElement, styles.passwordContainer)}>
        <Input
          id="password"
          ref={passwordRef}
          required
          type={showPassword ? "text" : "password"}
          placeholder={PASSWORD}
        />
        <Image
          src={showPassword ? eyeShow : eyeHide}
          alt="show-password"
          className={styles.showPasswordIcon}
          width={20}
          height={20}
          onClick={() => setShowPassword((showPassword) => !showPassword)}
        />
      </div>
      <div className={cx(styles.signUpFormElement, styles.passwordContainer)}>
        <Input
          id="confirm-password"
          required
          ref={confirmPasswordRef}
          type={showConfirmPassword ? "text" : "password"}
          placeholder={CONFIRM_PASSWORD}
        />
        <Image
          src={showConfirmPassword ? eyeShow : eyeHide}
          alt="show-confirm-password"
          className={styles.showPasswordIcon}
          width={20}
          height={20}
          onClick={() =>
            setShowConfirmPassword(
              (setShowConfirmPassword) => !setShowConfirmPassword,
            )
          }
        />
      </div>
      <Button
        className={styles.signUpButton}
        id="sign-up-button"
        type="submit"
        variant="primary"
      >
        {displayLoader ? <Loader /> : SIGN_UP}
      </Button>
      <div className={styles.loginActions}>
        <Text size="small">{ALREADY_JOINED}</Text>
        <Button
          id="signup-text"
          className={styles.loginButton}
          type="button"
          variant="text"
          onClickAction={() => {
            router.push("/login");
          }}
        >
          {LOGIN}
        </Button>
      </div>
    </form>
  );
};
