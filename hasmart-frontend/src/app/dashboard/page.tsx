"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useBranch } from "@/providers/branch-provider";
import { useBranches, useCreateBranch, useUpdateBranch, useDeleteBranch } from "@/hooks/app/use-branch";
import { useDebounce } from "@/hooks/use-debounce";
import { Branch } from "@/types/app/branch";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Store, MapPin, Phone, Plus, Pencil, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/providers/auth-provider";

// --- Schema ---
const branchFormSchema = z.object({
    code: z.string().min(1, "Kode wajib diisi"),
    name: z.string().min(1, "Nama wajib diisi"),
    address: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    email: z.string().email("Email tidak valid").optional().nullable().or(z.literal("")),
    fax: z.string().optional().nullable(),
    npwp: z.string().optional().nullable(),
    ownerName: z.string().optional().nullable(),
    receiptSize: z.string().optional().nullable(),
    receiptFooter: z.string().optional().nullable(),
    receiptPrinter: z.string().optional().nullable(),
    labelBarcodePrinter: z.string().optional().nullable(),
    reportPrinter: z.string().optional().nullable(),
});

type BranchFormValues = z.infer<typeof branchFormSchema>;

export default function DashboardPage() {
    const router = useRouter();
    const { branch, setBranch } = useBranch();
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearch = useDebounce(searchTerm, 200);

    // Dialog states
    const [formOpen, setFormOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
    const [deletingBranch, setDeletingBranch] = useState<Branch | null>(null);

    // Hooks
    const { data: branchesData, isLoading } = useBranches({
        page: 1,
        limit: 50,
        search: debouncedSearch,
    });
    const { mutate: createBranch, isPending: isCreating } = useCreateBranch();
    const { mutate: updateBranch, isPending: isUpdating } = useUpdateBranch();
    const { mutate: deleteBranch, isPending: isDeleting } = useDeleteBranch();

    const form = useForm<BranchFormValues>({
        resolver: zodResolver(branchFormSchema),
        defaultValues: {
            code: "",
            name: "",
            address: "",
            phone: "",
            email: "",
            fax: "",
            npwp: "",
            ownerName: "",
            receiptSize: "",
            receiptFooter: "",
            receiptPrinter: "",
            labelBarcodePrinter: "",
            reportPrinter: "",
        },
    });

    // Redirect if branch selected
    useEffect(() => {
        if (branch) {
            router.push("/dashboard/overview");
        }
    }, [branch, router]);

    // Reset form when editing state changes
    useEffect(() => {
        if (editingBranch) {
            form.reset({
                code: editingBranch.code || "",
                name: editingBranch.name || "",
                address: editingBranch.address || "",
                phone: editingBranch.phone || "",
                email: editingBranch.email || "",
                fax: editingBranch.fax || "",
                npwp: editingBranch.npwp || "",
                ownerName: editingBranch.ownerName || "",
                receiptSize: editingBranch.receiptSize || "",
                receiptFooter: editingBranch.receiptFooter || "",
                receiptPrinter: editingBranch.receiptPrinter || "",
                labelBarcodePrinter: editingBranch.labelBarcodePrinter || "",
                reportPrinter: editingBranch.reportPrinter || "",
            });
        } else {
            form.reset({
                code: "",
                name: "",
                address: "",
                phone: "",
                email: "",
                fax: "",
                npwp: "",
                ownerName: "",
                receiptSize: "",
                receiptFooter: "",
                receiptPrinter: "",
                labelBarcodePrinter: "",
                reportPrinter: "",
            });
        }
    }, [editingBranch, form]);

    const handleSelectBranch = (selectedBranch: Branch) => {
        setBranch(selectedBranch);
        router.push("/dashboard/overview");
    };

    const handleOpenCreate = () => {
        setEditingBranch(null);
        setFormOpen(true);
    };

    const handleOpenEdit = (e: React.MouseEvent, b: Branch) => {
        e.stopPropagation();
        setEditingBranch(b);
        setFormOpen(true);
    };

    const handleOpenDelete = (e: React.MouseEvent, b: Branch) => {
        e.stopPropagation();
        setDeletingBranch(b);
        setDeleteOpen(true);
    };

    const onSubmit = (values: BranchFormValues) => {
        const data = {
            ...values,
            email: values.email || null,
        };

        if (editingBranch) {
            updateBranch(
                { id: editingBranch.id, data },
                {
                    onSuccess: () => {
                        toast.success("Cabang berhasil diperbarui");
                        setFormOpen(false);
                        setEditingBranch(null);
                    },
                    onError: (error: unknown) => {
                        const err = error as { response?: { data?: { errors?: { message?: string } } } };
                        toast.error(err.response?.data?.errors?.message || "Gagal memperbarui cabang");
                    },
                }
            );
        } else {
            createBranch(data, {
                onSuccess: () => {
                    toast.success("Cabang berhasil dibuat");
                    setFormOpen(false);
                },
                onError: (error: unknown) => {
                    const err = error as { response?: { data?: { errors?: { message?: string } } } };
                    toast.error(err.response?.data?.errors?.message || "Gagal membuat cabang");
                },
            });
        }
    };

    const handleDelete = () => {
        if (!deletingBranch) return;
        deleteBranch(deletingBranch.id, {
            onSuccess: () => {
                toast.success("Cabang berhasil dihapus");
                setDeleteOpen(false);
                setDeletingBranch(null);
            },
            onError: (error: unknown) => {
                const err = error as { response?: { data?: { errors?: { message?: string } } } };
                toast.error(err.response?.data?.errors?.message || "Gagal menghapus cabang");
            },
        });
    };

    if (branch) {
        return (
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const isSuperUser = user?.isSuperUser ?? false;

    return (
        <div className="container mx-auto py-10 px-4 md:px-8 max-w-5xl">
            <div className="flex flex-col space-y-6 text-center mb-10">
                <h1 className="text-3xl font-bold tracking-tight">Selamat Datang di Hasmart</h1>
                <p className="text-muted-foreground text-lg">
                    Silakan pilih cabang untuk melanjutkan ke dashboard operasional.
                </p>
                <div className="mx-auto w-full max-w-md flex gap-2">
                    <Input
                        placeholder="Cari cabang..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-12 text-lg"
                    />
                    {isSuperUser && (
                        <Button onClick={handleOpenCreate} size="lg" className="h-12">
                            <Plus className="h-5 w-5 mr-2" /> Tambah
                        </Button>
                    )}
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
            ) : branchesData?.data && branchesData.data.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {branchesData.data.map((b: Branch) => (
                        <Card
                            key={b.id}
                            className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all group relative overflow-hidden"
                            onClick={() => handleSelectBranch(b)}
                        >
                            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
                                        <Store className="h-5 w-5" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-medium px-2 py-1 rounded bg-muted text-muted-foreground uppercase tracking-wider">
                                            {b.code}
                                        </span>
                                        {isSuperUser && (
                                            <>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={(e) => handleOpenEdit(e, b)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={(e) => handleOpenDelete(e, b)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <CardTitle className="text-xl">{b.name}</CardTitle>
                                <CardDescription className="line-clamp-1">
                                    {b.email || 'Tidak ada email'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                                    <div className="flex items-start gap-2">
                                        <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                                        <span className="line-clamp-2">{b.address || 'Alamat belum diatur'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4 shrink-0" />
                                        <span>{b.phone || '-'}</span>
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t w-full">
                                    <Button className="w-full" variant="secondary">
                                        Pilih Cabang
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-muted/30 rounded-lg border border-dashed">
                    <Store className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-medium">Tidak ada cabang ditemukan</h3>
                    <p className="text-muted-foreground mb-4">
                        {searchTerm ? `Tidak ada hasil untuk "${searchTerm}"` : "Belum ada data cabang."}
                    </p>
                    {isSuperUser && !searchTerm && (
                        <Button onClick={handleOpenCreate}>
                            <Plus className="h-4 w-4 mr-2" /> Tambah Cabang Pertama
                        </Button>
                    )}
                </div>
            )}

            {/* Create/Edit Dialog */}
            <Dialog open={formOpen} onOpenChange={setFormOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingBranch ? "Edit Cabang" : "Tambah Cabang Baru"}</DialogTitle>
                        <DialogDescription>
                            {editingBranch
                                ? "Perbarui informasi cabang di bawah ini."
                                : "Isi informasi cabang baru di bawah ini."}
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
                                            <FormLabel>Kode Cabang *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="CGK" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nama Cabang *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Cabang Jakarta" {...field} />
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
                                            <Textarea
                                                placeholder="Jl. Contoh No. 1, Jakarta"
                                                {...field}
                                                value={field.value ?? ""}
                                            />
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
                                                <Input placeholder="021-1234567" {...field} value={field.value ?? ""} />
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
                                                <Input
                                                    type="email"
                                                    placeholder="jakarta@store.com"
                                                    {...field}
                                                    value={field.value ?? ""}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="fax"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Fax</FormLabel>
                                            <FormControl>
                                                <Input placeholder="021-1234568" {...field} value={field.value ?? ""} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="npwp"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>NPWP</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="12.345.678.9-012.000"
                                                    {...field}
                                                    value={field.value ?? ""}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="ownerName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nama Pemilik</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Budi Santoso" {...field} value={field.value ?? ""} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="border-t pt-4 mt-4">
                                <h4 className="font-medium mb-4 text-sm text-muted-foreground">Pengaturan Struk & Printer</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="receiptSize"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Ukuran Struk</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="58mm" {...field} value={field.value ?? ""} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="receiptPrinter"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Printer Struk</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="EPSON TM-T82"
                                                        {...field}
                                                        value={field.value ?? ""}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="receiptFooter"
                                    render={({ field }) => (
                                        <FormItem className="mt-4">
                                            <FormLabel>Footer Struk</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Terima kasih atas kunjungan Anda!"
                                                    {...field}
                                                    value={field.value ?? ""}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-2 gap-4 mt-4">
                                    <FormField
                                        control={form.control}
                                        name="labelBarcodePrinter"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Printer Label Barcode</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="ZEBRA ZD220"
                                                        {...field}
                                                        value={field.value ?? ""}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="reportPrinter"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Printer Laporan</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="HP LaserJet"
                                                        {...field}
                                                        value={field.value ?? ""}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setFormOpen(false)}
                                >
                                    Batal
                                </Button>
                                <Button type="submit" disabled={isCreating || isUpdating}>
                                    {(isCreating || isUpdating) && (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    )}
                                    {editingBranch ? "Simpan Perubahan" : "Buat Cabang"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Cabang</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus cabang{" "}
                            <strong>{deletingBranch?.name}</strong>? Tindakan ini tidak dapat
                            dibatalkan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Hapus
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
