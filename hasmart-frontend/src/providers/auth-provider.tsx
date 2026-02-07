"use client";

import {
    createContext,
    useContext,
    useCallback,
    ReactNode,
    useMemo,
    useState,
    useEffect,
} from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useProfile } from "@/hooks/app/use-user";
import { User } from "@/types/app/user";

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    logout: () => void;
    refetch: () => void;
    accessToken: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const router = useRouter();
    const queryClient = useQueryClient();

    // Use the useProfile hook for caching
    const { data, isLoading, refetch, isError } = useProfile();

    const user = data?.data || null;
    const isAuthenticated = !!user && !isError;
    const [accessToken, setAccessToken] = useState<string | null>(null);

    const logout = useCallback(() => {
        // Clear token from localStorage
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");

        // Clear selected branch
        localStorage.removeItem("selectedBranch");

        // Invalidate all queries
        queryClient.clear();

        // Redirect to login
        router.push("/login");
    }, [queryClient, router]);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            setAccessToken(token);
        }
    }, []);

    const value = useMemo(
        () => ({
            user,
            isLoading,
            isAuthenticated,
            logout,
            refetch,
            accessToken,
        }),
        [user, isLoading, isAuthenticated, logout, refetch, accessToken]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
