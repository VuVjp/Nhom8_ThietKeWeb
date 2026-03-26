import { create } from 'zustand';
import type { AuthUser } from '../types/auth';

const REFRESH_TOKEN_KEY = 'nhom8_refresh_token';

const getStoredRefreshToken = () => {
    try {
        return sessionStorage.getItem(REFRESH_TOKEN_KEY);
    } catch {
        return null;
    }
};

const setStoredRefreshToken = (token: string | null) => {
    try {
        if (!token) {
            sessionStorage.removeItem(REFRESH_TOKEN_KEY);
            return;
        }

        sessionStorage.setItem(REFRESH_TOKEN_KEY, token);
    } catch {
        // Ignore storage failures and keep auth in memory.
    }
};

interface AuthState {
    user: AuthUser | null;
    accessToken: string | null;
    refreshToken: string | null;
    isBootstrapping: boolean;
    setAuth: (payload: { user: AuthUser; accessToken: string; refreshToken: string }) => void;
    setAccessToken: (token: string | null) => void;
    setRefreshToken: (token: string | null) => void;
    setBootstrapping: (state: boolean) => void;
    clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    accessToken: null,
    refreshToken: getStoredRefreshToken(),
    isBootstrapping: true,
    setAuth: ({ user, accessToken, refreshToken }) => {
        setStoredRefreshToken(refreshToken);
        set({ user, accessToken, refreshToken });
    },
    setAccessToken: (accessToken) => set({ accessToken }),
    setRefreshToken: (refreshToken) => {
        setStoredRefreshToken(refreshToken);
        set({ refreshToken });
    },
    setBootstrapping: (isBootstrapping) => set({ isBootstrapping }),
    clearAuth: () => {
        setStoredRefreshToken(null);
        set({ user: null, accessToken: null, refreshToken: null });
    },
}));
