"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { useUserStatus } from "@/hooks/app/use-user";
import { Loader2 } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: statusData, isLoading: statusLoading } = useUserStatus();

  useEffect(() => {
    // Wait for both to finish loading
    if (authLoading || statusLoading) return;

    const hasUsers = statusData?.data?.hasUsers;

    // If no users exist, go to first-time setup
    if (hasUsers === false) {
      router.push("/setup");
      return;
    }

    // If authenticated, go to dashboard
    if (isAuthenticated) {
      router.push("/dashboard/overview");
    } else {
      // Not authenticated, go to login
      router.push("/login");
    }
  }, [router, isAuthenticated, authLoading, statusLoading, statusData]);

  if (authLoading || statusLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Mengalihkan...</p>
    </div>
  );
}
