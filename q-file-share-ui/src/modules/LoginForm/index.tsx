import styles from "./LoginForm.module.css";
import cx from "classnames";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useRef, useState } from "react";

import { EMAIL, LOGIN, NEW_USER, PASSWORD, SIGN_UP } from "@/constants";
import { Button, Input, Loader, Text } from "@/elements";

import eyeHide from "@/assets/eye-hide.svg";
import eyeShow from "@/assets/eye-show.svg";

interface ILoginFormProps {
  displayLoader: boolean;
  handleLoginSubmission: (e: string | undefined, p: string | undefined) => void;
}

export const LoginForm = (props: ILoginFormProps): JSX.Element => {
  const { displayLoader, handleLoginSubmission } = props;

  const router = useRouter();

  const [showPassword, setShowPassword] = useState<boolean>(false);

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const handleLoginFormSubmission = (event: FormEvent): void => {
    event.preventDefault();

    const email: string | undefined = emailRef.current?.value;
    const password: string | undefined = passwordRef.current?.value;

    handleLoginSubmission(email, password);
  };

  return (
    <form className={styles.loginForm} onSubmit={handleLoginFormSubmission}>
      <div className={styles.loginFormElement}>
        <Input
          id="email"
          ref={emailRef}
          type="email"
          required
          placeholder={EMAIL}
        />
      </div>
      <div className={cx(styles.loginFormElement, styles.passwordContainer)}>
        <Input
          id="password"
          ref={passwordRef}
          type={showPassword ? "text" : "password"}
          required
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
      <Button
        className={styles.loginButton}
        id="login-button"
        type="submit"
        variant="primary"
      >
        {displayLoader ? <Loader /> : LOGIN}
      </Button>
      <div className={styles.signUpActions}>
        <Text size="small">{NEW_USER}</Text>
        <Button
          id="signup-text"
          className={styles.signUpButton}
          type="button"
          variant="text"
          onClickAction={() => {
            router.push("/sign-up");
          }}
        >
          {SIGN_UP}
        </Button>
      </div>
    </form>
  );
};
