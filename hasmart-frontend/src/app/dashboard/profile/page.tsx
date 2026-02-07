"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, User as UserIcon, Lock } from "lucide-react";
import { toast } from "sonner";


import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Separator } from "@/components/ui/separator";

import { useProfile, useUpdateProfile, useChangePassword } from "@/hooks/app/use-user";
import { useEffect } from "react";
import { AxiosError } from "axios";

// --- Validation Schemas ---

const editProfileSchema = z.object({
    name: z.string().min(3, "Nama harus diisi minimal 3 karakter"),
});

const changePasswordSchema = z.object({
    oldPassword: z.string().min(6, "Password lama minimal 6 karakter"),
    newPassword: z.string().min(6, "Password baru minimal 6 karakter"),
});

type EditProfileFormValues = z.infer<typeof editProfileSchema>;
type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

export default function ProfilePage() {
    const { data: profile, isLoading: isProfileLoading } = useProfile();

    const { mutate: updateProfile, isPending: isUpdating } = useUpdateProfile();
    const { mutate: changePassword, isPending: isChangingPassword } = useChangePassword();

    // --- Forms ---
    const profileForm = useForm<EditProfileFormValues>({
        resolver: zodResolver(editProfileSchema),
        defaultValues: {
            name: "",
        },
    });

    const passwordForm = useForm<ChangePasswordFormValues>({
        resolver: zodResolver(changePasswordSchema),
        defaultValues: {
            oldPassword: "",
            newPassword: "",
        },
    });

    // Populate profile form when data loads
    useEffect(() => {
        if (profile?.data) {
            profileForm.reset({
                name: profile.data.name,
            });
        }
    }, [profile, profileForm]);

    // --- Handlers ---
    const onProfileSubmit = (values: EditProfileFormValues) => {
        updateProfile(values, {
            onSuccess: () => {
                toast.success("Profil berhasil diperbarui");
            },
            onError: (error) => {
                const message = (error instanceof AxiosError ? error?.response?.data?.errors?.message : "Gagal membuat item")
                toast.error(message);
            },
        });
    };

    const onPasswordSubmit = (values: ChangePasswordFormValues) => {
        changePassword(values, {
            onSuccess: () => {
                toast.success("Password berhasil diubah");
                passwordForm.reset();
            },
            onError: (error) => {
                const message = (error instanceof AxiosError ? error?.response?.data?.errors?.message : "Gagal membuat item")
                toast.error(message);
            },
        });
    };

    if (isProfileLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Profil Saya</h2>
                <p className="text-muted-foreground">
                    Kelola informasi profil dan keamanan akun Anda.
                </p>
            </div>
            <Separator />

            <div className="grid gap-6 md:grid-cols-2">
                {/* Edit Profile Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UserIcon className="h-5 w-5" />
                            Informasi Pribadi
                        </CardTitle>
                        <CardDescription>
                            Perbarui nama untuk akses sistem Anda di sini.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...profileForm}>
                            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                                <FormField
                                    control={profileForm.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nama</FormLabel>
                                            <FormControl>
                                                <Input placeholder="shift1" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" disabled={isUpdating}>
                                    {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Simpan Perubahan
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>

                {/* Change Password Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Lock className="h-5 w-5" />
                            Keamanan
                        </CardTitle>
                        <CardDescription>
                            Ubah password akun Anda secara berkala.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...passwordForm}>
                            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                                <FormField
                                    control={passwordForm.control}
                                    name="oldPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Password Lama</FormLabel>
                                            <FormControl>
                                                <Input type="password" placeholder="******" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={passwordForm.control}
                                    name="newPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Password Baru</FormLabel>
                                            <FormControl>
                                                <Input type="password" placeholder="******" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" disabled={isChangingPassword}>
                                    {isChangingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Ubah Password
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
