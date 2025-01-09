import { IListElement } from "@/modules/ListModule";

const sortListByNumbers = (
  list: any[],
  key: any,
  sortAscending: boolean,
): any[] => {
  return [...list].sort((element1: any, element2: any): number => {
    const comparison: number = element1[key] - element2[key];
    return sortAscending ? comparison : -comparison;
  });
};

const sortListByDate = (
  list: any[],
  key: any,
  sortAscending: boolean,
): any[] => {
  return [...list].sort((element1: any, element2: any): number => {
    const date1: Date = new Date(element1[key]);
    const date2: Date = new Date(element2[key]);
    const comparison: number = date1.getTime() - date2.getTime();
    return sortAscending ? comparison : -comparison;
  });
};

const sortListByString = (
  list: any[],
  key: any,
  sortAscending: boolean,
): any[] => {
  return [...list].sort((element1: any, element2: any): number => {
    const comparison: number = element1[key].localeCompare(element2[key]);
    return sortAscending ? comparison : -comparison;
  });
};

export const sortListElementsByColumn = (
  listElements: IListElement[],
  columnKey: keyof IListElement,
  sortAscending: boolean,
): IListElement[] => {
  if (typeof listElements === "undefined") return [];

  if (columnKey === "size" || columnKey == "downloads")
    return sortListByNumbers(listElements, columnKey, sortAscending);
  else if (columnKey === "transactionDate" || columnKey === "expiry")
    return sortListByDate(listElements, columnKey, sortAscending);

  return sortListByString(listElements, columnKey, sortAscending);
};
