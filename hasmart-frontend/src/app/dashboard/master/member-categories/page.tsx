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
    FormDescription,
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

import { MemberCategory } from "@/types/master/member-category";
import {
    useMemberCategories,
    useCreateMemberCategory,
    useUpdateMemberCategory,
    useDeleteMemberCategory,
} from "@/hooks/master/use-member-category";
import { useDebounce } from "@/hooks/use-debounce";
import { DataTable } from "@/components/ui/data-table/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table/data-table-column-header";
import { DataTableToolbar } from "@/components/ui/data-table/data-table-toolbar";
import { useAccessControl, UserAccess } from "@/hooks/use-access-control";

// --- Validation Schema ---
const memberCategorySchema = z.object({
    code: z.string().min(1, "Kode kategori harus diisi"),
    name: z.string().min(1, "Nama kategori harus diisi"),
    color: z
        .string()
        .length(6, "Warna harus 6 karakter hex (tanpa #)")
        .regex(/^[0-9A-Fa-f]{6}$/, "Format hex tidak valid"),
});

type MemberCategoryFormValues = z.infer<typeof memberCategorySchema>;

export default function MemberCategoriesPage() {
    useAccessControl([UserAccess.accessMasterMemberCategoryRead], true);
    const hasAccess = useAccessControl([UserAccess.accessMasterMemberCategoryWrite], false);
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
    const { data: categoryData, isLoading: isCategoryLoading } = useMemberCategories({
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        search: debouncedSearch,
        sort: sorting[0]?.desc ? "desc" : "asc",
        sortBy: sorting[0]?.id,
    });

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<MemberCategory | null>(null);
    const [deletingCategory, setDeletingCategory] = useState<MemberCategory | null>(null);

    const { mutate: createCategory, isPending: isCreating } = useCreateMemberCategory();
    const { mutate: updateCategory, isPending: isUpdating } = useUpdateMemberCategory();
    const { mutate: deleteCategory, isPending: isDeleting } = useDeleteMemberCategory();

    const form = useForm<MemberCategoryFormValues>({
        resolver: zodResolver(memberCategorySchema),
        defaultValues: {
            code: "",
            name: "",
            color: "000000",
        },
    });

    const handleEditClick = useMemo(() => (category: MemberCategory) => {
        setEditingCategory(category);
        form.reset({
            code: category.code,
            name: category.name,
            color: category.color,
        });
        setIsCreateOpen(true);
    }, [form]);

    // --- Table Columns ---
    const columns = useMemo<ColumnDef<MemberCategory>[]>(() => [
        {
            accessorKey: "code",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Kode" />
            ),
        },
        {
            accessorKey: "name",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Nama Kategori" />
            ),
        },
        {
            accessorKey: "color",
            header: "Warna",
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <div
                        className="h-6 w-6 rounded-full border shadow-sm"
                        style={{ backgroundColor: `#${row.original.color}` }}
                    />
                    <span className="font-mono text-xs text-muted-foreground">
                        #{row.original.color}
                    </span>
                </div>
            ),
        },
        {
            accessorKey: "memberCount",
            header: "Jumlah Member",
            cell: ({ row }) => (
                <div className="text-center font-medium">
                    {row.original.memberCount || 0}
                </div>
            ),
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
                const category = row.original;
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
                            <DropdownMenuItem onClick={() => handleEditClick(category)}>
                                <Pencil className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => setDeletingCategory(category)}
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
        data: categoryData?.data || [],
        columns,
        state: {
            pagination,
            sorting,
            columnVisibility,
        },
        pageCount: categoryData?.pagination?.totalPages || -1,
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
            setEditingCategory(null);
            form.reset({
                code: "",
                name: "",
                color: "000000",
            });
        }
    };

    const onSubmit = (values: MemberCategoryFormValues) => {
        if (editingCategory) {
            updateCategory(
                { id: editingCategory.id, data: values },
                {
                    onSuccess: () => {
                        setIsCreateOpen(false);
                        toast.success("Kategori berhasil diperbarui");
                    },
                    onError: (error: unknown) => {
                        const err = error as { response?: { data?: { errors?: { message?: string } } } };
                        toast.error(err?.response?.data?.errors?.message || "Gagal memperbarui kategori");
                    }
                }
            );
        } else {
            createCategory(values, {
                onSuccess: () => {
                    setIsCreateOpen(false);
                    toast.success("Kategori berhasil dibuat");
                },
                onError: (error: unknown) => {
                    const err = error as { response?: { data?: { errors?: { message?: string } } } };
                    toast.error(err?.response?.data?.errors?.message || "Gagal membuat kategori");
                }
            });
        }
    };

    const handleDelete = () => {
        if (deletingCategory) {
            deleteCategory(deletingCategory.id, {
                onSuccess: () => {
                    setDeletingCategory(null);
                    toast.success("Kategori berhasil dihapus");
                },
                onError: (error: unknown) => {
                    const err = error as { response?: { data?: { errors?: { message?: string } } } };
                    toast.error(err?.response?.data?.errors?.message || "Gagal menghapus kategori");
                }
            });
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">Kategori Member</h2>
                {hasAccess &&
                    <Button onClick={() => { setEditingCategory(null); setIsCreateOpen(true); }}>
                        <Plus className="mr-2 h-4 w-4" /> Tambah Kategori
                    </Button>
                }
            </div>

            <DataTableToolbar
                table={table}
                filterValue={searchTerm}
                onFilterChange={setSearchTerm}
                placeholder="Cari kategori..."
            />

            <DataTable
                table={table}
                columnsLength={columns.length}
                isLoading={isCategoryLoading}
                showSelectedRowCount={false}
            />

            {/* Create/Edit Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={handleOpenChange}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{editingCategory ? "Edit Kategori" : "Tambah Kategori Baru"}</DialogTitle>
                        <DialogDescription>
                            Isi formulir di bawah ini untuk {editingCategory ? "memperbarui" : "membuat"} data kategori member.
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="code"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Kode (Wajib)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="cth: G01" {...field} disabled={!!editingCategory} />
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
                                        <FormLabel>Nama Kategori (Wajib)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="cth: Gold Member" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="color"
                                render={({ field: { value, onChange, ...fieldProps } }) => (
                                    <FormItem>
                                        <FormLabel>Warna Identitas</FormLabel>
                                        <div className="flex gap-2">
                                            <div className="relative flex h-10 w-full items-center gap-2 rounded-md border border-input bg-transparent px-3 py-1 shadow-sm focus-within:ring-1 focus-within:ring-ring">
                                                <input
                                                    type="color"
                                                    className="h-6 w-6 cursor-pointer border-none bg-transparent p-0 outline-none"
                                                    value={`#${value}`}
                                                    onChange={(e) => {
                                                        const hex = e.target.value.replace("#", "");
                                                        onChange(hex);
                                                    }}
                                                />
                                                <Input
                                                    className="border-none shadow-none focus-visible:ring-0"
                                                    placeholder="000000"
                                                    maxLength={6}
                                                    value={value}
                                                    onChange={(e) => {
                                                        // Allow only hex chars
                                                        const val = e.target.value.replace(/[^0-9A-Fa-f]/g, "").slice(0, 6);
                                                        onChange(val);
                                                    }}
                                                    {...fieldProps}
                                                />
                                            </div>
                                        </div>
                                        <FormDescription>
                                            Pilih warna atau masukkan kode hex 6 digit (tanpa #).
                                        </FormDescription>
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
            <AlertDialog open={!!deletingCategory} onOpenChange={(open) => !open && setDeletingCategory(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tindakan ini tidak dapat dibatalkan. Ini akan menghapus kategori
                            <strong> {deletingCategory?.name}</strong> secara permanen.
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
