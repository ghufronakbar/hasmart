import AuthGuard from "@/components/auth/auth-guard";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { BranchProvider } from "@/providers/branch-provider";


export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthGuard>
            <BranchProvider>
                <div className="flex h-screen w-full overflow-hidden bg-background">
                    <Sidebar />
                    <div className="flex flex-1 flex-col overflow-hidden">
                        <Navbar />
                        <main className="flex-1 overflow-auto p-4 lg:p-6">
                            {children}
                        </main>
                    </div>
                </div>
            </BranchProvider>
        </AuthGuard>
    );
}
