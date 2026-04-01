import axios, { AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5082/api';
const ACCESS_TOKEN_KEY = 'token';
const REFRESH_TOKEN_KEY = 'refreshToken';
const LEGACY_ACCESS_TOKEN_KEYS = ['access-token', 'cg-admin-access-token'] as const;
const LEGACY_REFRESH_TOKEN_KEYS = ['refresh_token', 'refresh-token', 'cg-admin-refresh-token'] as const;

export function getAccessToken() {
    return (
        localStorage.getItem(ACCESS_TOKEN_KEY) ??
        LEGACY_ACCESS_TOKEN_KEYS.map((key) => localStorage.getItem(key)).find((value) => Boolean(value)) ??
        null
    );
}

export function setAccessToken(token: string) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function removeAccessToken() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    LEGACY_ACCESS_TOKEN_KEYS.forEach((key) => localStorage.removeItem(key));
}

export function getRefreshToken() {
    return (
        localStorage.getItem(REFRESH_TOKEN_KEY) ??
        LEGACY_REFRESH_TOKEN_KEYS.map((key) => localStorage.getItem(key)).find((value) => Boolean(value)) ??
        null
    );
}

export function setRefreshToken(token: string) {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

export function removeRefreshToken() {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    LEGACY_REFRESH_TOKEN_KEYS.forEach((key) => localStorage.removeItem(key));
}

export function clearAuthTokens() {
    removeAccessToken();
    removeRefreshToken();
}

export interface ApiError {
    status: number;
    message: string;
    details?: unknown;
}

export function toApiError(error: unknown): ApiError {
    const fallback: ApiError = {
        status: 0,
        message: 'Unexpected error',
    };

    if (!axios.isAxiosError(error)) {
        return fallback;
    }

    const axiosError = error as AxiosError<{ message?: string; Message?: string }>;
    const message =
        axiosError.response?.data?.message ??
        axiosError.response?.data?.Message ??
        axiosError.message ??
        fallback.message;

    return {
        status: axiosError.response?.status ?? 0,
        message,
        details: axiosError.response?.data,
    };
}

export const httpClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
});

type QueueCallback = (token: string | null) => void;

interface RefreshEnvelope {
    token?: string;
    Token?: string;
    accessToken?: string;
    AccessToken?: string;
    refreshToken?: string;
    RefreshToken?: string;
    refeshToken?: string;
    RefeshToken?: string;
}

let isRefreshing = false;
let pendingQueue: QueueCallback[] = [];

function flushQueue(token: string | null) {
    pendingQueue.forEach((cb) => cb(token));
    pendingQueue = [];
}

async function refreshAccessToken() {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
        return null;
    }

    const response = await axios.post<RefreshEnvelope>(
        `${API_BASE_URL}/auth/refresh-token`,
        { refreshToken },
        { headers: { 'Content-Type': 'application/json' } },
    );

    const nextAccessToken =
        response.data.token ??
        response.data.Token ??
        response.data.accessToken ??
        response.data.AccessToken ??
        null;
    const nextRefreshToken =
        response.data.refreshToken ??
        response.data.RefreshToken ??
        response.data.refeshToken ??
        response.data.RefeshToken ??
        null;

    if (!nextAccessToken || !nextRefreshToken) {
        return null;
    }

    setAccessToken(nextAccessToken);
    setRefreshToken(nextRefreshToken);

    return nextAccessToken;
}

httpClient.interceptors.request.use((config) => {
    const token = getAccessToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('[HTTP] Authorization header set:', config.headers.Authorization.substring(0, 30) + '...');
    }
    return config;
});

httpClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as (typeof error.config & { _retry?: boolean }) | undefined;

        if (!originalRequest || originalRequest._retry || error.response?.status !== 401) {
            return Promise.reject(error);
        }

        originalRequest._retry = true;

        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                pendingQueue.push((token) => {
                    if (!token) {
                        reject(error);
                        return;
                    }
                    if (originalRequest.headers) {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                    }
                    resolve(httpClient(originalRequest));
                });
            });
        }

        isRefreshing = true;
        try {
            const nextToken = await refreshAccessToken();
            if (!nextToken) {
                clearAuthTokens();
                flushQueue(null);
                return Promise.reject(error);
            }

            flushQueue(nextToken);

            if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${nextToken}`;
            }

            return httpClient(originalRequest);
        } catch (refreshError) {
            clearAuthTokens();
            flushQueue(null);
            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    },
);
