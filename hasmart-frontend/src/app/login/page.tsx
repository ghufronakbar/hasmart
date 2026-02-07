"use client";

import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/constants/query-keys";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { userService } from "@/services/app/user.service";

const formSchema = z.object({
    name: z.string().min(1, { message: "Nama pengguna harus diisi" }),
    password: z.string().min(1, { message: "Kata sandi harus diisi" }),
});

type FormValues = z.infer<typeof formSchema>;

export default function LoginPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            password: "",
        },
    });

    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    async function onSubmit(data: FormValues) {
        setIsLoading(true);
        setError("");
        try {
            const response = await userService.login({
                name: data.name,
                password: data.password,
            });
            await sleep(1000);

            if (response.data?.accessToken) {
                localStorage.setItem("token", response.data.accessToken);
                if (response.data.refreshToken) {
                    localStorage.setItem("refreshToken", response.data.refreshToken);
                }

                // Clear any stale auth state
                await queryClient.resetQueries({ queryKey: queryKeys.app.user.all });

                // Ensure selectedBranch is cleared or handled appropriately on new login
                localStorage.removeItem("selectedBranch");
                router.push("/dashboard/profile");
            } else {
                setError("Gagal masuk: Token tidak diterima dari server");
            }
        } catch (err: unknown) {
            console.error(err);
            setError("Nama pengguna atau kata sandi salah");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-muted/40 p-4">
            <Card className="w-full max-w-sm">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold">Masuk</CardTitle>
                    <CardDescription>
                        Masukkan nama pengguna dan kata sandi Anda untuk masuk ke aplikasi
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
                                            <Input placeholder="Masukkan nama pengguna" {...field} />
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
                                        <FormLabel>Kata Sandi</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder="Masukkan kata sandi" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {error && (
                                <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
                                    {error}
                                </div>
                            )}
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isLoading ? "Sedang Masuk..." : "Masuk"}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
