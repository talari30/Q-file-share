export const setAuthToken = (token: string): boolean => {
  if (token && typeof window !== "undefined") {
    localStorage?.setItem("token", token);
    return true;
  }
  return false;
};

export const getAuthToken = (): string | null =>
  typeof window !== "undefined" ? localStorage?.getItem("token") : "";

export const removeAuthToken = (): void => {
  localStorage.removeItem("token");
};

export const isValidToken = (): boolean => {
  const authToken: string | null = getAuthToken();
  return (
    typeof authToken === "string" &&
    authToken !== null &&
    authToken.trim() !== ""
  );
};
