import { RECEIVE_FILE_FROM, SENT_FILE_TO } from "@/constants";

export const getActivityTypeMessage = (activityType: string): string => {
  if (typeof activityType === "undefined") return "";
  return activityType === "send" ? SENT_FILE_TO : RECEIVE_FILE_FROM;
};

export const capitalizeFirstLetter = (iString: string): string =>
  iString.charAt(0).toUpperCase() + iString.slice(1).toLowerCase();

export const getDateFromISOFormat = (dateString: string): string => {
  if (typeof dateString === "undefined") return "";
  const date: Date = new Date(dateString);

  const month: string = (date.getMonth() + 1).toString().padStart(2, "0");
  const day: string = date.getDate().toString().padStart(2, "0");
  const year: number = date.getFullYear();

  return `${month}/${day}/${year}`;
};
