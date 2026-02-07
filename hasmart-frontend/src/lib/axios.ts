import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { ENV } from "@/constants/env";

export const axiosInstance = axios.create({
  baseURL: ENV.API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    // Client-side only - get token from localStorage/cookie if needed
    // Note: HttpOnly cookies are handled automatically by browser
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

interface FailedRequest {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}

let isRefreshing = false;
let failedQueue: FailedRequest[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        if (typeof window !== "undefined") {
          const refreshToken = localStorage.getItem("refreshToken");
          if (!refreshToken) {
            throw new Error("No refresh token");
          }

          // Manually fetch to avoid circular dependency or interceptor loops
          // We can't use userService.refreshToken here directly if it imports axiosInstance circularly
          // But since userService imports axiosInstance, and we are modifying axiosInstance, it's safer to use a raw axios call
          // OR import userService dynamically if needed.
          // However, using a separate axios instance or fetch is cleanest for the refresh call itself.
          const { data } = await axios.post(
            ENV.API_URL + "/api/app/user/refresh",
            { refreshToken },
          );

          const { accessToken } = data.data;

          localStorage.setItem("token", accessToken);
          axiosInstance.defaults.headers.common["Authorization"] =
            `Bearer ${accessToken}`;
          originalRequest.headers["Authorization"] = `Bearer ${accessToken}`;

          processQueue(null, accessToken);

          return axiosInstance(originalRequest);
        }
      } catch (err) {
        processQueue(err, null);
        if (typeof window !== "undefined") {
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
          // Only redirect if not already on auth pages
          const allowed = ["/login", "/setup", "/"];
          if (!allowed.includes(window.location.pathname)) {
            window.location.href = "/login";
          }
        }
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);
