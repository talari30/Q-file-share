"use client";

import styles from "./login.module.css";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { LOGIN, LOGIN_FAILURE } from "@/constants";
import { useNotification } from "@/context";
import { Heading, Loader } from "@/elements";
import { LoginForm } from "@/modules";
import { axiosInstance, isValidToken, setAuthToken } from "@/utils";

import qfsLogo from "@/assets/qfs-logo.svg";

const LoginPage = (): JSX.Element => {
  const router = useRouter();

  const { addNotification } = useNotification();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [displayFormLoader, setDisplayFormLoader] = useState<boolean>(false);

  useEffect(() => {
    const checkAuthToken = async () => {
      if (isValidToken()) {
        await router.replace("/dashboard");
      } else {
        setIsLoading(false);
      }
    };
    checkAuthToken();
  }, []);

  const handleLoginSubmission = async (
    email?: string,
    password?: string,
  ): Promise<void> => {
    setDisplayFormLoader(true);
    try {
      const response = await axiosInstance.post(
        "/auth/login",
        { email, password },
        { headers: { skipAuth: true } },
      );
      if (response.status === 200) {
        setAuthToken(response.data?.token);
        router.replace("/dashboard");
      }
    } catch (error: any) {
      addNotification({
        type: "error",
        message: error?.response?.data?.detail || LOGIN_FAILURE,
      });
    } finally {
      setDisplayFormLoader(false);
    }
  };

  return (
    <div className={isLoading ? styles.loading : styles.container}>
      {isLoading ? (
        <Loader isStatic />
      ) : (
        <>
          <div className={styles.logo}>
            <Image
              src={qfsLogo}
              alt="qfs-logo"
              width={120}
              height={120}
              priority
            />
          </div>
          <div className={styles.loginForm}>
            <Heading size={3}>{LOGIN}</Heading>
            <LoginForm
              displayLoader={displayFormLoader}
              handleLoginSubmission={handleLoginSubmission}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default LoginPage;
