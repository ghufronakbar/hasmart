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

import {
    useBranches,
    useCreateBranch,
    useUpdateBranch,
    useDeleteBranch,
} from "@/hooks/app/use-branch";
import { Branch } from "@/types/app/branch";
import { useBranch as useBranchContext } from "@/providers/branch-provider";
import { useDebounce } from "@/hooks/use-debounce";
import { DataTable } from "@/components/ui/data-table/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table/data-table-column-header";
import { DataTableToolbar } from "@/components/ui/data-table/data-table-toolbar";
import { useAccessControl, UserAccess } from "@/hooks/use-access-control";

// --- Validation Schema ---
const branchSchema = z.object({
    code: z.string().min(1, "Kode cabang harus diisi").max(10, "Kode maksimal 10 karakter"),
    name: z.string().min(1, "Nama cabang harus diisi"),
    address: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email("Email tidak valid").optional().or(z.literal("")),
});

type BranchFormValues = z.infer<typeof branchSchema>;

export default function BranchPage() {
    const hasAccess = useAccessControl([UserAccess.accessAppBranchWrite], false);
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
    const { data: branchData, isLoading: isBranchLoading } = useBranches({
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        search: debouncedSearch,
        sort: sorting[0]?.desc ? "desc" : "asc",
        sortBy: sorting[0]?.id,
    });

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
    const [deletingBranch, setDeletingBranch] = useState<Branch | null>(null);

    const { mutate: createBranch, isPending: isCreating } = useCreateBranch();
    const { mutate: updateBranch, isPending: isUpdating } = useUpdateBranch();
    const { mutate: deleteBranch, isPending: isDeleting } = useDeleteBranch();

    // Context to potentially update if current branch is modified
    const { branch: currentBranch, setBranch: setCurrentBranch } = useBranchContext();

    const form = useForm<BranchFormValues>({
        resolver: zodResolver(branchSchema),
        defaultValues: {
            code: "",
            name: "",
            address: "",
            phone: "",
            email: "",
        },
    });

    const handleEditClick = useMemo(() => (branch: Branch) => {
        setEditingBranch(branch);
        form.reset({
            code: branch.code,
            name: branch.name,
            address: branch.address || "",
            phone: branch.phone || "",
            email: branch.email || "",
        });
        setIsCreateOpen(true);
    }, [form]);



    // --- Table Columns ---
    const columns = useMemo<ColumnDef<Branch>[]>(() => [
        {
            accessorKey: "code",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Kode" />
            ),
        },
        {
            accessorKey: "name",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Nama Cabang" />
            ),
        },
        {
            accessorKey: "phone",
            header: "Telepon",
        },
        {
            accessorKey: "address",
            header: "Alamat",
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
                const branch = row.original;
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
                            <DropdownMenuItem onClick={() => handleEditClick(branch)}>
                                <Pencil className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => setDeletingBranch(branch)}
                            >
                                <Trash2 className="mr-2 h-4 w-4" /> Hapus
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ], [handleEditClick]);

    // --- Table Instance ---
    const table = useReactTable({
        data: branchData?.data || [],
        columns,
        state: {
            pagination,
            sorting,
            columnVisibility,
        },
        pageCount: branchData?.pagination?.totalPages || -1,
        onPaginationChange: setPagination,
        onSortingChange: setSorting,
        onColumnVisibilityChange: setColumnVisibility,
        getCoreRowModel: getCoreRowModel(),
        manualPagination: true,
        manualSorting: true,
        // We handle filtering manually via debouncedSearch/API
        manualFiltering: true,
    });

    // --- Handlers ---
    const handleOpenChange = (open: boolean) => {
        setIsCreateOpen(open);
        if (!open) {
            setEditingBranch(null);
            form.reset({
                code: "",
                name: "",
                address: "",
                phone: "",
                email: "",
            });
        }
    };



    const onSubmit = (values: BranchFormValues) => {
        if (editingBranch) {
            updateBranch(
                { id: editingBranch.id, data: values },
                {
                    onSuccess: (updatedData) => {
                        setIsCreateOpen(false);
                        toast.success("Cabang berhasil diperbarui");
                        if (currentBranch?.id === editingBranch.id) {
                            if (updatedData.data) setCurrentBranch(updatedData.data);
                        }
                    },
                    onError: (error: unknown) => {
                        const err = error as { response?: { data?: { errors?: { message?: string } } } };
                        toast.error(err?.response?.data?.errors?.message || "Gagal memperbarui cabang");
                    }
                }
            );
        } else {
            createBranch(values, {
                onSuccess: () => {
                    setIsCreateOpen(false);
                    toast.success("Cabang berhasil dibuat");
                },
                onError: (error: unknown) => {
                    const err = error as { response?: { data?: { errors?: { message?: string } } } };
                    toast.error(err?.response?.data?.errors?.message || "Gagal membuat cabang");
                }
            });
        }
    };

    const handleDelete = () => {
        if (deletingBranch) {
            deleteBranch(deletingBranch.id, {
                onSuccess: () => {
                    setDeletingBranch(null);
                    toast.success("Cabang berhasil dihapus");
                    if (currentBranch?.id === deletingBranch.id) {
                        setCurrentBranch(null);
                        toast.info("Cabang aktif telah dihapus, silakan pilih cabang lain.");
                    }
                },
                onError: (error: unknown) => {
                    const err = error as { response?: { data?: { errors?: { message?: string } } } };
                    toast.error(err?.response?.data?.errors?.message || "Gagal menghapus cabang");
                }
            });
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">Manajemen Cabang</h2>
                {hasAccess &&
                    <Button onClick={() => { setEditingBranch(null); setIsCreateOpen(true); }}>
                        <Plus className="mr-2 h-4 w-4" /> Tambah Cabang
                    </Button>
                }
            </div>

            <DataTableToolbar
                table={table}
                filterValue={searchTerm}
                onFilterChange={setSearchTerm}
                placeholder="Cari cabang..."
            />

            <DataTable
                table={table}
                columnsLength={columns.length}
                isLoading={isBranchLoading}
                showSelectedRowCount={false}
            />

            {/* Create/Edit Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={handleOpenChange}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{editingBranch ? "Edit Cabang" : "Tambah Cabang Baru"}</DialogTitle>
                        <DialogDescription>
                            Isi formulir di bawah ini untuk {editingBranch ? "memperbarui" : "membuat"} data cabang.
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
                                                <Input placeholder="cth: JKT1" {...field} disabled={!!editingBranch} />
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
                                            <FormLabel>Nama Cabang (Wajib)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="cth: Cabang Jakarta" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Telepon</FormLabel>
                                        <FormControl>
                                            <Input placeholder="08123456789" {...field} />
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
                                            <Input placeholder="email@contoh.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="address"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Alamat</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Jl. Raya No. 123" {...field} />
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
            <AlertDialog open={!!deletingBranch} onOpenChange={(open) => !open && setDeletingBranch(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tindakan ini tidak dapat dibatalkan. Ini akan menghapus cabang
                            <strong> {deletingBranch?.name}</strong> secara permanen dari daftar aktif.
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
