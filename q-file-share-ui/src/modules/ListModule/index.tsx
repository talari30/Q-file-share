import styles from "./ListModule.module.css";

import Image from "next/image";
import { useState } from "react";

import {
  getDateFromISOFormat,
  getFileSize,
  sortListElementsByColumn,
} from "@/utils";
import {
  NAME,
  SIZE,
  SENT_TO,
  RECEIVED_FROM,
  DOWNLOAD_COUNT,
  DOWNLOADS_REMAINING,
  EXPIRY,
  SENT_ON,
  RECEIVED_ON,
  NO_FILES_MESSAGE,
} from "@/constants";

import upArrowIcon from "@/assets/up-arrow.svg";
import downArrowIcon from "@/assets/down-arrow.svg";
import downloadIcon from "@/assets/download-icon.svg";

export interface IListElement {
  fileId?: string;
  name: string;
  size: number;
  transceive: string;
  transactionDate: string;
  expiry: string;
  downloads: number;
}

type SortedElementsOrder = {
  [K in keyof IListElement]: boolean;
};

interface IListModuleProps {
  elements: IListElement[];
  fileDownloadHandler: (fileId: string, fileName: string) => void;
  renderSendFilesLayout?: boolean;
}

const getArrowDirection = (isAscending?: boolean): any => {
  if (isAscending) return upArrowIcon;
  else return downArrowIcon;
};

const initialElementsOrder: SortedElementsOrder = {
  name: true,
  size: true,
  transceive: true,
  downloads: true,
  transactionDate: false,
  expiry: true,
};

export const ListModule = (props: IListModuleProps): JSX.Element => {
  const {
    elements,
    renderSendFilesLayout = false,
    fileDownloadHandler,
  } = props;

  const [listElements, setListElements] = useState<IListElement[]>(
    elements || [],
  );
  const [sortedElementsOrder, setSortedElementsOrder] =
    useState<SortedElementsOrder>(initialElementsOrder);

  const handleSort = (columnKey: keyof IListElement): void => {
    const sortedListElements: IListElement[] = sortListElementsByColumn(
      listElements,
      columnKey,
      !sortedElementsOrder[columnKey],
    );
    setListElements(sortedListElements);
    setSortedElementsOrder((pSortedElementsOrder) => ({
      ...initialElementsOrder,
      [columnKey]: !pSortedElementsOrder[columnKey],
    }));
  };

  const handleFileDownload = async (
    index: number,
    fileName: string,
  ): Promise<void> => {
    fileDownloadHandler(listElements[index]?.fileId || "", fileName);
    !renderSendFilesLayout &&
      setListElements((prevElements) =>
        prevElements.map((item: IListElement, i: number) =>
          i === index
            ? { ...item, downloads: Math.max((item.downloads || 0) - 1, 0) }
            : item,
        ),
      );
  };

  return (
    <div className={styles.tableContainer}>
      {typeof elements === "undefined" || elements.length === 0 ? (
        NO_FILES_MESSAGE
      ) : (
        <table className={styles.table}>
          <thead className={styles.tableHeader}>
            <tr>
              <th
                className={styles.tableHeaderValue}
                onClick={() => handleSort("name")}
              >
                <div className={styles.headerDiv}>
                  {NAME}
                  <Image
                    src={getArrowDirection(sortedElementsOrder["name"])}
                    alt="arrow-icon"
                    width={12}
                    height={12}
                  />
                </div>
              </th>
              <th
                className={styles.tableHeaderValue}
                onClick={() => handleSort("size")}
              >
                <div className={styles.headerDiv}>
                  {SIZE}
                  <Image
                    src={getArrowDirection(sortedElementsOrder["size"])}
                    alt="arrow-icon"
                    width={12}
                    height={12}
                  />
                </div>
              </th>
              <th
                className={styles.tableHeaderValue}
                onClick={() => handleSort("transceive")}
              >
                {renderSendFilesLayout ? SENT_TO : RECEIVED_FROM}
                <Image
                  src={getArrowDirection(sortedElementsOrder["transceive"])}
                  alt="arrow-icon"
                  width={12}
                  height={12}
                />
              </th>
              <th
                className={styles.tableHeaderValue}
                onClick={() => handleSort("transactionDate")}
              >
                {renderSendFilesLayout ? SENT_ON : RECEIVED_ON}
                <Image
                  src={getArrowDirection(
                    sortedElementsOrder["transactionDate"],
                  )}
                  alt="arrow-icon"
                  width={12}
                  height={12}
                />
              </th>
              <th
                className={styles.tableHeaderValue}
                onClick={() => handleSort("expiry")}
              >
                {EXPIRY}
                <Image
                  src={getArrowDirection(sortedElementsOrder["expiry"])}
                  alt="arrow-icon"
                  width={12}
                  height={12}
                />
              </th>
              <th
                className={styles.tableHeaderValue}
                onClick={() => handleSort("downloads")}
              >
                {renderSendFilesLayout ? DOWNLOAD_COUNT : DOWNLOADS_REMAINING}
                <Image
                  src={getArrowDirection(sortedElementsOrder["downloads"])}
                  alt="arrow-icon"
                  width={12}
                  height={12}
                />
              </th>
            </tr>
          </thead>
          <tbody>
            {listElements.map((element: IListElement, index: number) => (
              <tr key={index}>
                <td className={styles.tableCell}>
                  <span
                    className={styles.nameSpan}
                    onClick={() => handleFileDownload(index, element?.name)}
                  >
                    {element?.name || ""}
                    <Image
                      src={downloadIcon}
                      className={styles.downloadIcon}
                      alt="download-icon"
                      width={18}
                      height={18}
                    />
                  </span>
                </td>
                <td className={styles.tableCell}>
                  {getFileSize(element?.size || 0)}
                </td>
                <td className={styles.tableCell}>
                  {element?.transceive || ""}
                </td>
                <td className={styles.tableCell}>
                  {getDateFromISOFormat(element?.transactionDate)}
                </td>
                <td className={styles.tableCell}>
                  {getDateFromISOFormat(element?.expiry) || ""}
                </td>
                <td className={styles.tableCell}>{element?.downloads || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};
