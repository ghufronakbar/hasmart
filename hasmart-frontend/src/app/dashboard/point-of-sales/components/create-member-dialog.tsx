"use client";

import { useForm, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
    Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { Member } from "@/types/master/member";
import { useCreateMember } from "@/hooks/master/use-member";
import { useMemberCategories } from "@/hooks/master/use-member-category";

// --- Validation Schema ---
const memberSchema = z.object({
    code: z.string().min(1, "Kode member harus diisi"),
    name: z.string().min(1, "Nama member harus diisi"),
    phone: z.string().optional().or(z.literal("")),
    email: z.string().email("Format email tidak valid").optional().or(z.literal("")),
    address: z.string().optional().or(z.literal("")),
    masterMemberCategoryId: z.coerce.number().min(1, "Kategori member harus dipilih"),
});

type MemberFormValues = z.infer<typeof memberSchema>;

interface CreateMemberDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: (member: Member) => void;
}

export function CreateMemberDialog({ open, onOpenChange, onSuccess }: CreateMemberDialogProps) {
    const { data: categoryData } = useMemberCategories({ limit: 100 });
    const { mutate: createMember, isPending: isCreating } = useCreateMember();

    const form = useForm<MemberFormValues>({
        resolver: zodResolver(memberSchema) as Resolver<MemberFormValues>,
        defaultValues: {
            code: "",
            name: "",
            phone: "",
            email: "",
            address: "",
            masterMemberCategoryId: 0,
        },
    });

    const onSubmit = (values: MemberFormValues) => {
        createMember(values, {
            onSuccess: (response) => {
                toast.success("Member berhasil dibuat");
                onOpenChange(false);
                form.reset();
                if (response.data) {
                    onSuccess(response.data);
                }
            },
            onError: (error: unknown) => {
                const err = error as { response?: { data?: { errors?: { message?: string } } } };
                toast.error(err?.response?.data?.errors?.message || "Gagal membuat member");
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={(val) => {
            onOpenChange(val);
            if (!val) form.reset();
        }}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Tambah Member Baru</DialogTitle>
                    <DialogDescription>
                        Isi formulir di bawah ini untuk mendaftarkan member baru.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="code"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Kode (Wajib)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="cth: 6285112345678" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="masterMemberCategoryId"
                                render={({ field }) => (
                                    <FormItem className="w-full">
                                        <FormLabel>Kategori Member (Wajib)</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value ? field.value.toString() : undefined}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Pilih kategori" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {categoryData?.data?.map((category) => (
                                                    <SelectItem key={category.id} value={category.id.toString()}>
                                                        <div className="flex items-center gap-2">
                                                            <div
                                                                className="h-3 w-3 rounded-full border border-muted-foreground/20"
                                                                style={{ backgroundColor: `#${category.color}` }}
                                                            />
                                                            <span>{category.name}</span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nama Member (Wajib)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="cth: Budi Santoso" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Telepon</FormLabel>
                                        <FormControl>
                                            <Input placeholder="cth: 08123456789" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input placeholder="cth: email@contoh.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Alamat</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Alamat lengkap member" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Batal
                            </Button>
                            <Button type="submit" disabled={isCreating}>
                                {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Simpan & Pilih
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
