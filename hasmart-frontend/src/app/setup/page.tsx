"use client";

import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/constants/query-keys";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFirstTimeSetup, useUserStatus } from "@/hooks/app/use-user";
import { LoginResponse } from "@/types/app/user";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { backupRestoreService } from "@/services/data/backup-restore.service";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { AxiosError } from "axios";

const setupSchema = z.object({
    name: z.string().min(3, "Nama minimal 3 karakter"),
    password: z.string().min(6, "Password minimal 6 karakter"),
    confirmPassword: z.string().min(6, "Password minimal 6 karakter"),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Password tidak cocok",
    path: ["confirmPassword"],
});

type SetupFormValues = z.infer<typeof setupSchema>;

export default function SetupPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { data: statusData, isLoading: statusLoading } = useUserStatus();
    const { mutate: doSetup, isPending } = useFirstTimeSetup();

    const form = useForm<SetupFormValues>({
        resolver: zodResolver(setupSchema),
        defaultValues: {
            name: "",
            password: "",
            confirmPassword: "",
        },
    });

    // Redirect if users already exist
    useEffect(() => {
        if (!statusLoading && statusData?.data?.hasUsers === true) {
            router.push("/login");
        }
    }, [statusLoading, statusData, router]);

    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));


    const onSubmit = (values: SetupFormValues) => {
        doSetup(
            { name: values.name, password: values.password },
            {
                onSuccess: async (data) => {
                    const response = data as unknown as LoginResponse;
                    if (response.data?.accessToken) {
                        localStorage.setItem("token", response.data.accessToken);
                        if (response.data.refreshToken) {
                            localStorage.setItem("refreshToken", response.data.refreshToken);
                        }
                    }

                    // Clear any stale auth state
                    await queryClient.resetQueries({ queryKey: queryKeys.app.user.all });

                    toast.success("Akun admin berhasil dibuat!");
                    await sleep(1000);
                    router.push("/dashboard/profile");
                },
                onError: (error: unknown) => {
                    const err = error as { response?: { data?: { errors?: { message?: string } } } };
                    toast.error(
                        err.response?.data?.errors?.message ||
                        "Gagal membuat akun admin"
                    );
                },
            }
        );
    };

    if (statusLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // If users exist, redirect (handled by useEffect)
    if (statusData?.data?.hasUsers === true) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
            <div className="w-full max-w-md space-y-6">
                <Card>
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl font-bold">Selamat Datang!</CardTitle>
                        <CardDescription>
                            Buat akun admin pertama untuk memulai menggunakan sistem
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nama Pengguna</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="admin"
                                                    autoComplete="username"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Password</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="password"
                                                    placeholder="••••••••"
                                                    autoComplete="new-password"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="confirmPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Konfirmasi Password</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="password"
                                                    placeholder="••••••••"
                                                    autoComplete="new-password"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <Button type="submit" className="w-full" disabled={isPending}>
                                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Buat Akun Admin
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">Or</span>
                    </div>
                </div>

                <RestoreSection onSuccess={() => router.push("/login")} />
            </div>
        </div>
    );
}

function RestoreSection({ onSuccess }: { onSuccess: () => void }) {
    const [isRestoring, setIsRestoring] = useState(false);
    const [file, setFile] = useState<File | null>(null);

    const handleRestore = async () => {
        if (!file) return;
        if (!confirm("Restore database dari backup? Pastikan file backup valid.")) return;

        setIsRestoring(true);
        try {
            await backupRestoreService.restoreDatabase(file);
            toast.success("Restore berhasil! Silakan login dengan akun dari backup.");
            await new Promise(r => setTimeout(r, 1000));
            onSuccess();
        } catch (error) {
            console.error(error);
            const msg = error instanceof AxiosError ? error.response?.data?.errors?.message : "Gagal restore database";
            toast.error(msg);
        } finally {
            setIsRestoring(false);
        }
    }

    return (
        <Card className="border-dashed">
            <CardHeader className="text-center pb-2">
                <CardTitle className="text-lg">Restore Backup</CardTitle>
                <CardDescription>
                    Punya file backup? Restore langsung di sini.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Alert className="bg-muted/50 text-muted-foreground border-muted">
                    <AlertTitle className="text-xs font-semibold uppercase">Catatan Penting</AlertTitle>
                    <AlertDescription className="text-xs mt-1">
                        Setelah restore berhasil, akun super user akan direset menjadi:
                        <br />
                        <strong>Username: admin</strong>
                        <br />
                        <strong>Password: 12345678</strong>
                    </AlertDescription>
                </Alert>

                <div className="grid w-full max-w-sm items-center gap-1.5">
                    <Input
                        id="backup-file"
                        type="file"
                        accept=".dump"
                        onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                    />
                </div>
                <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleRestore}
                    disabled={!file || isRestoring}
                >
                    {isRestoring ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Restoring...
                        </>
                    ) : (
                        "Restore Database"
                    )}
                </Button>
            </CardContent>
        </Card>
    )
}
