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

import { ItemCategory } from "@/types/master/item-category";
import {
    useItemCategories,
    useCreateItemCategory,
    useUpdateItemCategory,
    useDeleteItemCategory,
} from "@/hooks/master/use-item-category";
import { useDebounce } from "@/hooks/use-debounce";
import { DataTable } from "@/components/ui/data-table/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table/data-table-column-header";
import { DataTableToolbar } from "@/components/ui/data-table/data-table-toolbar";
import { useAccessControl, UserAccess } from "@/hooks/use-access-control";

// --- Validation Schema ---
const itemCategorySchema = z.object({
    code: z.string().min(1, "Kode kategori harus diisi"),
    name: z.string().min(1, "Nama kategori harus diisi"),
});

type ItemCategoryFormValues = z.infer<typeof itemCategorySchema>;

export default function ItemCategoriesPage() {
    useAccessControl([UserAccess.accessMasterItemCategoryRead], true);
    const hasAccess = useAccessControl([UserAccess.accessMasterItemCategoryWrite], false);
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
    const { data: categoryData, isLoading: isCategoryLoading } = useItemCategories({
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        search: debouncedSearch,
        sort: sorting[0]?.desc ? "desc" : "asc",
        sortBy: sorting[0]?.id,
    });

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<ItemCategory | null>(null);
    const [deletingCategory, setDeletingCategory] = useState<ItemCategory | null>(null);

    const { mutate: createCategory, isPending: isCreating } = useCreateItemCategory();
    const { mutate: updateCategory, isPending: isUpdating } = useUpdateItemCategory();
    const { mutate: deleteCategory, isPending: isDeleting } = useDeleteItemCategory();

    const form = useForm<ItemCategoryFormValues>({
        resolver: zodResolver(itemCategorySchema),
        defaultValues: {
            code: "",
            name: "",
        },
    });

    const handleEditClick = useMemo(() => (category: ItemCategory) => {
        setEditingCategory(category);
        form.reset({
            code: category.code,
            name: category.name,
        });
        setIsCreateOpen(true);
    }, [form]);

    // --- Table Columns ---
    const columns = useMemo<ColumnDef<ItemCategory>[]>(() => [
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
            });
        }
    };

    const onSubmit = (values: ItemCategoryFormValues) => {
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
                <h2 className="text-2xl font-bold tracking-tight">Kategori Barang</h2>
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
                            Isi formulir di bawah ini untuk {editingCategory ? "memperbarui" : "membuat"} data kategori barang.
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
                                            <Input placeholder="cth: K01" {...field} disabled={!!editingCategory} />
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
                                            <Input placeholder="cth: Makanan Ringan" {...field} />
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
