import { useCallback, useEffect, useMemo, useRef, type PropsWithChildren } from 'react';
import { authService } from '../api/auth.service';
import { useAuthStore } from '../store/auth.store';
import type { LoginRequest } from '../types/auth';
import { AuthContext } from './AuthContext';

export interface AuthContextValue {
    user: ReturnType<typeof useAuthStore.getState>['user'];
    isAuthenticated: boolean;
    isBootstrapping: boolean;
    login: (payload: LoginRequest) => Promise<void>;
    logout: () => Promise<void>;
}

export const AuthProvider = ({ children }: PropsWithChildren) => {
    const { user, accessToken, refreshToken, isBootstrapping, setAuth, clearAuth, setBootstrapping } = useAuthStore();
    const didBootstrapRef = useRef(false);

    const login = useCallback(
        async (payload: LoginRequest) => {
            const response = await authService.login(payload);
            setAuth({ user: response.user, accessToken: response.accessToken, refreshToken: response.refreshToken });
        },
        [setAuth],
    );

    const logout = useCallback(async () => {
        try {
            if (refreshToken) {
                await authService.logout(refreshToken);
            }
        } finally {
            clearAuth();
        }
    }, [clearAuth, refreshToken]);

    useEffect(() => {
        if (didBootstrapRef.current) {
            return;
        }

        didBootstrapRef.current = true;

        const bootstrap = async () => {
            const initialRefreshToken = useAuthStore.getState().refreshToken;

            if (!initialRefreshToken) {
                clearAuth();
                setBootstrapping(false);
                return;
            }

            try {
                const response = await authService.refresh(initialRefreshToken);
                setAuth({ user: response.user, accessToken: response.accessToken, refreshToken: response.refreshToken });
            } catch {
                clearAuth();
            } finally {
                setBootstrapping(false);
            }
        };

        void bootstrap();
    }, [clearAuth, setAuth, setBootstrapping]);

    const value = useMemo<AuthContextValue>(
        () => ({
            user,
            isAuthenticated: Boolean(user && accessToken),
            isBootstrapping,
            login,
            logout,
        }),
        [accessToken, isBootstrapping, login, logout, user],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
