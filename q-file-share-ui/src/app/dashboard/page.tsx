"use client";

import styles from "./dashboard.module.css";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  SEND_FILES,
  SEND_FILES_TEXT,
  RECEIVED_FILES,
  RECEIVED_FILES_TEXT,
  SHARED_FILES,
  SHARED_FILES_TEXT,
  GENERIC_ERROR_MESSAGE,
  SESSION_EXPIRED_MESSAGE,
} from "@/constants";
import { useNotification } from "@/context";
import { Loader } from "@/elements";
import { ActivityCard, Card, NavBar, IActivity } from "@/modules";
import {
  axiosInstance,
  getAuthToken,
  getFileActivities,
  isValidToken,
  removeAuthToken,
} from "@/utils";

import sendFileIcon from "@/assets/send-file-icon.svg";
import receivedFilesIcon from "@/assets/received-files-icon.svg";
import sharedFilesIcon from "@/assets/shared-files-icon.svg";

const Dashboard = (): JSX.Element => {
  const router = useRouter();

  const { addNotification } = useNotification();

  const [activities, setActivities] = useState<IActivity[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const getActivity = async (): Promise<void> => {
      if (!isValidToken()) {
        await router.replace("/login");
        return;
      }

      try {
        const response = await axiosInstance.get("/file/activity", {
          headers: {
            Authorization: getAuthToken(),
          },
        });
        if (response?.status === 200) {
          setActivities(getFileActivities(response.data?.activities));
        }
      } catch (error: any) {
        if (error?.response?.status === 401) {
          addNotification({ message: SESSION_EXPIRED_MESSAGE, type: "warn" });
          removeAuthToken();
          await router.replace("/login");
        } else {
          setActivities([]);
          addNotification({
            type: "error",
            message: error?.response?.data?.detail || GENERIC_ERROR_MESSAGE,
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    getActivity();
  }, [router]);

  return (
    <>
      <NavBar />
      <div className={styles.dashboardContainer}>
        {isLoading ? (
          <Loader isStatic />
        ) : (
          <>
            <div className={styles.cardContainer}>
              <Card
                id="send-file-card"
                className={styles.card}
                src={sendFileIcon}
                title={SEND_FILES}
                description={SEND_FILES_TEXT}
                onClickHandler={() => {
                  router.push("/send-files");
                }}
              />
              <Card
                id="received-files-card"
                className={styles.card}
                src={receivedFilesIcon}
                title={RECEIVED_FILES}
                description={RECEIVED_FILES_TEXT}
                onClickHandler={() => {
                  router.push("/received-files");
                }}
              />
              <Card
                id="shared-files-card"
                className={styles.card}
                src={sharedFilesIcon}
                title={SHARED_FILES}
                description={SHARED_FILES_TEXT}
                onClickHandler={() => {
                  router.push("/shared-files");
                }}
              />
            </div>
            <div className={styles.activityContainer}>
              <ActivityCard activities={activities} />
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default Dashboard;
