import axios, { AxiosResponse } from "axios";
import { getAuthToken } from "../auth-token";

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    if (!config.headers.skipAuth) {
      const token = getAuthToken();
      if (token) {
        config.headers.Authorization = `${token}`;
      }
    } else {
      delete config.headers.skipAuth;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export default axiosInstance;
