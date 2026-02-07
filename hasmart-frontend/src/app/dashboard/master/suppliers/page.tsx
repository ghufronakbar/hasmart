"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
    ColumnDef,
    getCoreRowModel,
    useReactTable,
    PaginationState,
    SortingState,
    VisibilityState,
} from "@tanstack/react-table";
import {
    Loader2,
    Plus,
    Pencil,
    Trash2,
    MoreHorizontal,
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Textarea } from "@/components/ui/textarea";

import { Supplier } from "@/types/master/supplier";
import {
    useSuppliers,
    useCreateSupplier,
    useUpdateSupplier,
    useDeleteSupplier,
} from "@/hooks/master/use-supplier";
import { useDebounce } from "@/hooks/use-debounce";
import { DataTable } from "@/components/ui/data-table/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table/data-table-column-header";
import { DataTableToolbar } from "@/components/ui/data-table/data-table-toolbar";
import { useAccessControl, UserAccess } from "@/hooks/use-access-control";

// --- Validation Schema ---
const supplierSchema = z.object({
    code: z.string().min(1, "Kode supplier harus diisi"),
    name: z.string().min(1, "Nama supplier harus diisi"),
    phone: z.string().optional().or(z.literal("")),
    email: z.string().email("Format email tidak valid").optional().or(z.literal("")),
    address: z.string().optional().or(z.literal("")),
});

type SupplierFormValues = z.infer<typeof supplierSchema>;

export default function SuppliersPage() {
    useAccessControl([UserAccess.accessMasterSupplierRead], true);
    const hasAccess = useAccessControl([UserAccess.accessMasterSupplierWrite], false);
    // --- State ---
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: 10,
    });
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

    // Search State
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearch = useDebounce(searchTerm, 500);

    // --- Data Fetching ---
    const { data: supplierData, isLoading: isSupplierLoading } = useSuppliers({
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        search: debouncedSearch,
        sort: sorting[0]?.desc ? "desc" : "asc",
        sortBy: sorting[0]?.id,
    });

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null);

    const { mutate: createSupplier, isPending: isCreating } = useCreateSupplier();
    const { mutate: updateSupplier, isPending: isUpdating } = useUpdateSupplier();
    const { mutate: deleteSupplier, isPending: isDeleting } = useDeleteSupplier();

    const form = useForm<SupplierFormValues>({
        resolver: zodResolver(supplierSchema),
        defaultValues: {
            code: "",
            name: "",
            phone: "",
            email: "",
            address: "",
        },
    });

    const handleEditClick = useMemo(() => (supplier: Supplier) => {
        setEditingSupplier(supplier);
        form.reset({
            code: supplier.code,
            name: supplier.name,
            phone: supplier.phone || "",
            email: supplier.email || "",
            address: supplier.address || "",
        });
        setIsCreateOpen(true);
    }, [form]);

    // --- Table Columns ---
    const columns = useMemo<ColumnDef<Supplier>[]>(() => [
        {
            accessorKey: "code",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Kode" />
            ),
        },
        {
            accessorKey: "name",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Nama Supplier" />
            ),
        },
        {
            accessorKey: "phone",
            header: "Telepon",
        },
        {
            accessorKey: "email",
            header: "Email",
        },
        {
            accessorKey: "address",
            header: "Alamat",
            cell: ({ row }) => (
                <div className="max-w-[200px] truncate" title={row.getValue("address")}>
                    {row.getValue("address")}
                </div>
            )
        },
        {
            accessorKey: "createdAt",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Dibuat Pada" />
            ),
            cell: ({ row }) => {
                const date = new Date(row.getValue("createdAt"));
                return new Intl.DateTimeFormat("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                }).format(date);
            },
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const supplier = row.original;
                if (!hasAccess) return null;
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleEditClick(supplier)}>
                                <Pencil className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => setDeletingSupplier(supplier)}
                            >
                                <Trash2 className="mr-2 h-4 w-4" /> Hapus
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ], [handleEditClick, hasAccess]);

    // --- Table Instance ---
    const table = useReactTable({
        data: supplierData?.data || [],
        columns,
        state: {
            pagination,
            sorting,
            columnVisibility,
        },
        pageCount: supplierData?.pagination?.totalPages || -1,
        onPaginationChange: setPagination,
        onSortingChange: setSorting,
        onColumnVisibilityChange: setColumnVisibility,
        getCoreRowModel: getCoreRowModel(),
        manualPagination: true,
        manualSorting: true,
        manualFiltering: true,
    });

    // --- Handlers ---
    const handleOpenChange = (open: boolean) => {
        setIsCreateOpen(open);
        if (!open) {
            setEditingSupplier(null);
            form.reset({
                code: "",
                name: "",
                phone: "",
                email: "",
                address: "",
            });
        }
    };

    const onSubmit = (values: SupplierFormValues) => {
        if (editingSupplier) {
            updateSupplier(
                { id: editingSupplier.id, data: values },
                {
                    onSuccess: () => {
                        setIsCreateOpen(false);
                        toast.success("Supplier berhasil diperbarui");
                    },
                    onError: (error: unknown) => {
                        const err = error as { response?: { data?: { errors?: { message?: string } } } };
                        toast.error(err?.response?.data?.errors?.message || "Gagal memperbarui supplier");
                    }
                }
            );
        } else {
            createSupplier(values, {
                onSuccess: () => {
                    setIsCreateOpen(false);
                    toast.success("Supplier berhasil dibuat");
                },
                onError: (error: unknown) => {
                    const err = error as { response?: { data?: { errors?: { message?: string } } } };
                    toast.error(err?.response?.data?.errors?.message || "Gagal membuat supplier");
                }
            });
        }
    };

    const handleDelete = () => {
        if (deletingSupplier) {
            deleteSupplier(deletingSupplier.id, {
                onSuccess: () => {
                    setDeletingSupplier(null);
                    toast.success("Supplier berhasil dihapus");
                },
                onError: (error: unknown) => {
                    const err = error as { response?: { data?: { errors?: { message?: string } } } };
                    toast.error(err?.response?.data?.errors?.message || "Gagal menghapus supplier");
                }
            });
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">Manajemen Supplier</h2>
                {hasAccess &&
                    <Button onClick={() => { setEditingSupplier(null); setIsCreateOpen(true); }}>
                        <Plus className="mr-2 h-4 w-4" /> Tambah Supplier
                    </Button>
                }
            </div>

            <DataTableToolbar
                table={table}
                filterValue={searchTerm}
                onFilterChange={setSearchTerm}
                placeholder="Cari supplier..."
            />

            <DataTable
                table={table}
                columnsLength={columns.length}
                isLoading={isSupplierLoading}
                showSelectedRowCount={false}
            />

            {/* Create/Edit Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={handleOpenChange}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{editingSupplier ? "Edit Supplier" : "Tambah Supplier Baru"}</DialogTitle>
                        <DialogDescription>
                            Isi formulir di bawah ini untuk {editingSupplier ? "memperbarui" : "membuat"} data supplier.
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
                                                <Input placeholder="cth: SUP001" {...field} disabled={!!editingSupplier} />
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
                                            <FormLabel>Nama Supplier (Wajib)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="cth: PT Maju Jaya" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
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
                                            <Textarea placeholder="Alamat lengkap supplier" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <Button type="submit" disabled={isCreating || isUpdating}>
                                    {(isCreating || isUpdating) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Simpan
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Alert */}
            <AlertDialog open={!!deletingSupplier} onOpenChange={(open) => !open && setDeletingSupplier(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tindakan ini tidak dapat dibatalkan. Ini akan menghapus supplier
                            <strong> {deletingSupplier?.name}</strong> secara permanen.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => { e.preventDefault(); handleDelete(); }}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={isDeleting}
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
