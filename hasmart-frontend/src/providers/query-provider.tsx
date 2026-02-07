'use client';

/**
 * Query Provider
 * Wraps the app with TanStack Query client
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
interface QueryProviderProps {
    children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        // Stale time: 5 minutes
                        staleTime: 5 * 60 * 1000,
                        // Retry failed requests 1 time
                        retry: 1,
                        // Refetch on window focus
                        refetchOnWindowFocus: false,
                    },
                    mutations: {
                        // Retry failed mutations 0 times
                        retry: 0,
                        onError: () => {
                            // if (error instanceof AxiosError) {
                            //     toast(typeof error.response?.data?.errors?.message === "string" ? error.response?.data?.errors?.message : "Terjadi kesalahan");
                            // }
                        },
                    },
                },
            })
    );

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}

export default QueryProvider;
