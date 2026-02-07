"use client";

import { CircleUser, Menu, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { useBranch } from "@/providers/branch-provider";
import { useState } from "react";
import { MobileSidebar } from "./mobile-sidebar";
import Link from "next/link";
import { useProfile } from "@/hooks/app/use-user";
import { useAuth } from "@/providers/auth-provider";
import { useBranches } from "@/hooks/app/use-branch";
import { Branch } from "@/types/app/branch";

export function Navbar() {
    const router = useRouter();
    const { branch, setBranch } = useBranch();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { data: profile } = useProfile();
    const { logout } = useAuth();
    const { data: branchesData } = useBranches({ page: 1, limit: 50 });
    const branches = branchesData?.data ?? [];

    const handleSwitchBranch = () => {
        setBranch(null);
        router.push("/dashboard");
    };

    const handleSelectBranch = (b: Branch) => {
        setBranch(b);
    };

    return (
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">

            {/* Mobile Sidebar Trigger */}
            <Button
                variant="ghost"
                size="icon"
                className="md:hidden shrink-0"
                onClick={() => setMobileMenuOpen(true)}
            >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
            </Button>

            <MobileSidebar open={mobileMenuOpen} setOpen={setMobileMenuOpen} />

            <div className="w-full flex-1 min-w-0">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="outline"
                            className="w-full min-w-0 max-w-[200px] justify-start text-left font-normal md:w-[200px]"
                        >
                            <span className="truncate">
                                {branch ? branch.name : "Pilih Cabang"}
                            </span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-[200px]" align="start">
                        <DropdownMenuLabel>Pilih Cabang</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {branches.map((b) => (
                            <DropdownMenuItem
                                key={b.id}
                                onClick={() => handleSelectBranch(b)}
                            >
                                <span className="truncate flex-1">{b.name}</span>
                                {branch?.id === b.id && (
                                    <Check className="ml-auto h-4 w-4 shrink-0" />
                                )}
                            </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleSwitchBranch}>
                            Ubah Cabang
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <DropdownMenu>
                <span className="text-sm font-medium">{profile?.data?.name}</span>
                <DropdownMenuTrigger asChild>
                    <Button variant="secondary" size="icon" className="rounded-full">
                        <CircleUser className="h-5 w-5" />
                        <span className="sr-only">Toggle user menu</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Akun Saya</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <Link href="/dashboard/profile">
                        <DropdownMenuItem>Pengaturan</DropdownMenuItem>
                    </Link>
                    <DropdownMenuItem>Bantuan</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout}>Keluar</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </header>
    );
}
