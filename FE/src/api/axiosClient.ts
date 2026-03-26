import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { env } from '../utils/env';
import { useAuthStore } from '../store/auth.store';

type RetryableRequestConfig = InternalAxiosRequestConfig & {
    _retry?: boolean;
};

interface QueuePromise {
    resolve: (token: string) => void;
    reject: (error: unknown) => void;
}

interface RefreshApiResponse {
    token?: string;
    Token?: string;
    refreshToken?: string;
    RefreshToken?: string;
}

let isRefreshing = false;
let failedQueue: QueuePromise[] = [];

const processQueue = (error: unknown, token: string | null) => {
    failedQueue.forEach((promise) => {
        if (error != null || token == null) {
            promise.reject(error);
            return;
        }

        promise.resolve(token);
    });

    failedQueue = [];
};

const isAuthUrl = (url?: string) => {
    if (!url) {
        return false;
    }

    return url.includes('/Auth/login') || url.includes('/Auth/refresh-token') || url.includes('/Auth/logout');
};

const refreshClient = axios.create({
    baseURL: env.apiBaseUrl,
    withCredentials: true,
});

const apiClient = axios.create({
    baseURL: env.apiBaseUrl,
    withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

apiClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as RetryableRequestConfig | undefined;

        if (!originalRequest || error.response?.status !== 401 || originalRequest._retry || isAuthUrl(originalRequest.url)) {
            return Promise.reject(error);
        }

        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                failedQueue.push({
                    resolve: (token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        resolve(apiClient(originalRequest));
                    },
                    reject,
                });
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
            const currentRefreshToken = useAuthStore.getState().refreshToken;
            if (!currentRefreshToken) {
                throw new Error('Missing refresh token');
            }

            const response = await refreshClient.post<RefreshApiResponse>('/Auth/refresh-token', {
                refreshToken: currentRefreshToken,
            });

            const newToken = response.data.token ?? response.data.Token;
            const nextRefreshToken = response.data.refreshToken ?? response.data.RefreshToken;

            if (!newToken || !nextRefreshToken) {
                throw new Error('Invalid refresh response payload');
            }

            useAuthStore.getState().setAccessToken(newToken);
            useAuthStore.getState().setRefreshToken(nextRefreshToken);
            processQueue(null, newToken);

            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return apiClient(originalRequest);
        } catch (refreshError) {
            processQueue(refreshError, null);
            useAuthStore.getState().clearAuth();
            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    },
);

export { apiClient, refreshClient };
