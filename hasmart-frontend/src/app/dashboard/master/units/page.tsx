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

import { Unit } from "@/types/master/unit";
import {
    useUnits,
    useCreateUnit,
    useUpdateUnit,
    useDeleteUnit,
} from "@/hooks/master/use-unit";
import { useDebounce } from "@/hooks/use-debounce";
import { DataTable } from "@/components/ui/data-table/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table/data-table-column-header";
import { DataTableToolbar } from "@/components/ui/data-table/data-table-toolbar";
import { useAccessControl, UserAccess } from "@/hooks/use-access-control";

// --- Validation Schema ---
const unitSchema = z.object({
    unit: z.string().min(1, "Kode unit (satuan) harus diisi"),
    name: z.string().min(1, "Nama unit harus diisi"),
});

type UnitFormValues = z.infer<typeof unitSchema>;

export default function UnitsPage() {
    useAccessControl([UserAccess.accessMasterUnitRead], true);
    const hasAccess = useAccessControl([UserAccess.accessMasterUnitWrite], false);
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
    const { data: unitData, isLoading: isUnitLoading } = useUnits({
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        search: debouncedSearch,
        sort: sorting[0]?.desc ? "desc" : "asc",
        sortBy: sorting[0]?.id,
    });

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
    const [deletingUnit, setDeletingUnit] = useState<Unit | null>(null);

    const { mutate: createUnit, isPending: isCreating } = useCreateUnit();
    const { mutate: updateUnit, isPending: isUpdating } = useUpdateUnit();
    const { mutate: deleteUnit, isPending: isDeleting } = useDeleteUnit();

    const form = useForm<UnitFormValues>({
        resolver: zodResolver(unitSchema),
        defaultValues: {
            unit: "",
            name: "",
        },
    });

    const handleEditClick = useMemo(() => (unit: Unit) => {
        setEditingUnit(unit);
        form.reset({
            unit: unit.unit,
            name: unit.name,
        });
        setIsCreateOpen(true);
    }, [form]);

    // --- Table Columns ---
    const columns = useMemo<ColumnDef<Unit>[]>(() => [
        {
            accessorKey: "unit",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Unit (Kode)" />
            ),
        },
        {
            accessorKey: "name",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Nama Unit" />
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
                const unit = row.original;
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
                            <DropdownMenuItem onClick={() => handleEditClick(unit)}>
                                <Pencil className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => setDeletingUnit(unit)}
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
        data: unitData?.data || [],
        columns,
        state: {
            pagination,
            sorting,
            columnVisibility,
        },
        pageCount: unitData?.pagination?.totalPages || -1,
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
            setEditingUnit(null);
            form.reset({
                unit: "",
                name: "",
            });
        }
    };

    const onSubmit = (values: UnitFormValues) => {
        if (editingUnit) {
            updateUnit(
                { id: editingUnit.id, data: values },
                {
                    onSuccess: () => {
                        setIsCreateOpen(false);
                        toast.success("Unit berhasil diperbarui");
                    },
                    onError: (error: unknown) => {
                        const err = error as { response?: { data?: { errors?: { message?: string } } } };
                        toast.error(err?.response?.data?.errors?.message || "Gagal memperbarui unit");
                    }
                }
            );
        } else {
            createUnit(values, {
                onSuccess: () => {
                    setIsCreateOpen(false);
                    toast.success("Unit berhasil dibuat");
                },
                onError: (error: unknown) => {
                    const err = error as { response?: { data?: { errors?: { message?: string } } } };
                    toast.error(err?.response?.data?.errors?.message || "Gagal membuat unit");
                }
            });
        }
    };

    const handleDelete = () => {
        if (deletingUnit) {
            deleteUnit(deletingUnit.id, {
                onSuccess: () => {
                    setDeletingUnit(null);
                    toast.success("Unit berhasil dihapus");
                },
                onError: (error: unknown) => {
                    const err = error as { response?: { data?: { errors?: { message?: string } } } };
                    toast.error(err?.response?.data?.errors?.message || "Gagal menghapus unit");
                }
            });
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">Manajemen Unit</h2>
                {hasAccess &&
                    <Button onClick={() => { setEditingUnit(null); setIsCreateOpen(true); }}>
                        <Plus className="mr-2 h-4 w-4" /> Tambah Unit
                    </Button>
                }
            </div>

            <DataTableToolbar
                table={table}
                filterValue={searchTerm}
                onFilterChange={setSearchTerm}
                placeholder="Cari unit..."
            />

            <DataTable
                table={table}
                columnsLength={columns.length}
                isLoading={isUnitLoading}
                showSelectedRowCount={false}
            />

            {/* Create/Edit Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={handleOpenChange}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{editingUnit ? "Edit Unit" : "Tambah Unit Baru"}</DialogTitle>
                        <DialogDescription>
                            Isi formulir di bawah ini untuk {editingUnit ? "memperbarui" : "membuat"} data unit (satuan).
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="unit"
                                render={({ field: { onChange, ...fieldProps } }) => (
                                    <FormItem>
                                        <FormLabel>Unit / Kode (Wajib)</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="cth: PCS"
                                                onChange={(e) => onChange(e.target.value.toUpperCase())}
                                                {...fieldProps}
                                                disabled={!!editingUnit}
                                            />
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
                                        <FormLabel>Nama Unit (Wajib)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="cth: Piece" {...field} />
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
            <AlertDialog open={!!deletingUnit} onOpenChange={(open) => !open && setDeletingUnit(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tindakan ini tidak dapat dibatalkan. Ini akan menghapus unit
                            <strong> {deletingUnit?.name} ({deletingUnit?.unit})</strong> secara permanen.
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
