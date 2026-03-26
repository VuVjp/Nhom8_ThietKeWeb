import { useMemo, type PropsWithChildren } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider, theme as antdTheme } from 'antd';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../auth/AuthProvider';
import { useUiStore } from '../store/ui.store';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            refetchOnWindowFocus: false,
            staleTime: 30_000,
        },
    },
});

export const AppProviders = ({ children }: PropsWithChildren) => {
    const { isDarkMode } = useUiStore();

    const themeConfig = useMemo(
        () => ({
            algorithm: isDarkMode ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
            token: {
                borderRadius: 14,
                colorPrimary: '#0f766e',
            },
        }),
        [isDarkMode],
    );

    return (
        <ConfigProvider theme={themeConfig}>
            <QueryClientProvider client={queryClient}>
                <BrowserRouter>
                    <AuthProvider>{children}</AuthProvider>
                </BrowserRouter>
            </QueryClientProvider>
        </ConfigProvider>
    );
};
