"use client";

import { createContext, useContext, useState, ReactNode } from "react";

import { Notification, NotificationType } from "@/modules";

interface INotification {
  message: string;
  type?: NotificationType;
}

interface NotificationContextProps {
  addNotification: (notification: INotification) => void;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(
  undefined,
);

export const NotificationProvider = ({
  children,
}: {
  children: ReactNode;
}): JSX.Element => {
  const [notifications, setNotifications] = useState<INotification[]>([]);

  const addNotification = (notification: INotification): void => {
    if (
      notifications.some(
        (prevNotification: INotification) =>
          prevNotification.type === notification.type &&
          prevNotification.message === notification.message,
      )
    ) {
      return;
    }

    setNotifications((prev) => [...prev, notification]);
    setTimeout(() => {
      setNotifications((prev) => prev.slice(1));
    }, 5000);
  };

  return (
    <NotificationContext.Provider value={{ addNotification }}>
      {children}
      <div>
        {notifications.map((notification: INotification, index: number) => (
          <Notification
            key={index}
            message={notification.message}
            type={notification.type}
            onCloseHandler={() =>
              setNotifications((prev) => prev.filter((_, i) => i !== index))
            }
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextProps => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotification must be used within a NotificationProvider",
    );
  }
  return context;
};
