import styles from "./ActivityCard.module.css";
import cx from "classnames";

import Image from "next/image";
import { useRouter } from "next/navigation";

import { ACTIVITY, NO_RECENT_ACTIVITY } from "@/constants";
import { Heading, Text } from "@/elements";

import sentIcon from "@/assets/sent-icon.svg";
import receivedIcon from "@/assets/received-icon.svg";

export interface IActivity {
  message: string;
  type: "receive" | "send";
}

interface IActivityProps {
  className?: string;
  activities: IActivity[];
}

export const ActivityCard = (props: IActivityProps): JSX.Element => {
  const router = useRouter();

  const { className = "", activities } = props;

  const openActivityHandler = async (index: number): Promise<void> => {
    const type = activities[index]?.type;
    const route =
      type === "send"
        ? "/shared-files"
        : type === "receive"
          ? "/received-files"
          : undefined;
    if (route) {
      await router.push(route);
    }
  };

  return (
    <div className={cx(styles.activityCard, className)}>
      <div className={styles.heading}>
        <Heading size={2}>{ACTIVITY}</Heading>
      </div>
      <div className={styles.activityElementContainer}>
        {activities.length !== 0 ? (
          <ul className={styles.activityElementList}>
            {activities.map((activity: IActivity, index: number) => (
              <li
                className={styles.activityElement}
                key={index}
                onClick={() => openActivityHandler(index)}
              >
                <Image
                  src={activity.type === "send" ? sentIcon : receivedIcon}
                  className={styles.notificationIcon}
                  alt={`${activity?.type}-icon`}
                  width={20}
                  height={20}
                />
                <Text>{activity?.message || ""}</Text>
              </li>
            ))}
          </ul>
        ) : (
          <Text className={styles.noActivityText}>{NO_RECENT_ACTIVITY}</Text>
        )}
      </div>
    </div>
  );
};
