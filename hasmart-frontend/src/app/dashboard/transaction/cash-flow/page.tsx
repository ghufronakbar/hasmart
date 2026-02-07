"use client";

import { useMemo, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import {
    Loader2,
    Search,
    Trash2,
    X,
    Pencil,
    Plus,
} from "lucide-react";
import { toast } from "sonner";
import {
    useReactTable,
    SortingState,
    VisibilityState,
    getCoreRowModel,
    PaginationState,
    ColumnDef,
} from "@tanstack/react-table";
import { AxiosError } from "axios";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
    Dialog,
    DialogContent,
    DialogDescription,
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DataTable,
} from "@/components/ui/data-table/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table/data-table-column-header";
import { Textarea } from "@/components/ui/textarea";

import {
    useCashFlows,
    useCreateCashFlow,
    useUpdateCashFlow,
    useDeleteCashFlow,
} from "@/hooks/transaction/use-cash-flow";
import { useBranch } from "@/providers/branch-provider";
import { useDebounce } from "@/hooks/use-debounce";
import { useAccessControl, UserAccess } from "@/hooks/use-access-control";
import { CashFlow, CreateCashFlowDTO, UpdateCashFlowDTO } from "@/types/transaction/cash-flow";
import { DatePickerWithRange } from "@/components/custom/date-picker-with-range";
import { ActionBranchButton } from "@/components/custom/action-branch-button";

// --- Schema ---
const cashFlowSchema = z.object({
    branchId: z.coerce.number().min(1, "Branch wajib"),
    notes: z.string().min(1, "Catatan wajib diisi"),
    amount: z.coerce.number().min(1, "Jumlah harus lebih dari 0"),
    type: z.enum(["IN", "OUT"], { message: "Tipe wajib dipilih" }),
    transactionDate: z.date(),
});

type CashFlowFormValues = z.infer<typeof cashFlowSchema>;

export default function CashFlowPage() {
    useAccessControl([UserAccess.accessTransactionCashFlowRead], true);
    const hasAccess = useAccessControl([UserAccess.accessTransactionCashFlowWrite], false);
    const { branch } = useBranch();
    const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
    const [searchTerm, setSearchTerm] = useState("");
    const [sorting, setSorting] = useState<SortingState>([{
        id: "transactionDate",
        desc: true,
    }]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const debouncedSearch = useDebounce(searchTerm, 500);

    // Date Filter State
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
    const [editingItem, setEditingItem] = useState<CashFlow | null>(null);

    // --- Queries ---
    const { data: cashFlowData, isLoading } = useCashFlows({
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        search: debouncedSearch,
        sort: sorting[0]?.desc ? "desc" : "asc",
        sortBy: sorting[0]?.id,
        dateStart: dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
        dateEnd: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
    });

    const { mutate: createCashFlow, isPending: isCreating } = useCreateCashFlow();
    const { mutate: updateCashFlow, isPending: isUpdating } = useUpdateCashFlow();
    const { mutate: deleteCashFlow, isPending: isDeleting } = useDeleteCashFlow();

    // Reset editingItem when dialog closes
    const handleOpenChange = (open: boolean) => {
        setIsCreateOpen(open);
        if (!open) {
            setEditingItem(null);
            form.reset({
                branchId: branch?.id,
                transactionDate: new Date(),
                notes: "",
                amount: 0,
                type: "OUT"
            });
        }
    };

    // --- Create Form ---
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const form = useForm<CashFlowFormValues>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(cashFlowSchema) as any,
        defaultValues: {
            transactionDate: new Date(),
            branchId: branch?.id || 0,
            notes: "",
            amount: 0,
            type: "OUT",
        },
    });

    // Ensure branchId is set when branch context loads
    useEffect(() => {
        if (branch?.id) form.setValue("branchId", branch.id);
    }, [branch, form]);

    const onSubmit = (values: CashFlowFormValues) => {
        const payload: CreateCashFlowDTO | UpdateCashFlowDTO = {
            ...values,
            transactionDate: values.transactionDate.toISOString(),
        };

        if (editingItem) {
            updateCashFlow({ id: editingItem.id, data: payload }, {
                onSuccess: () => {
                    handleOpenChange(false);
                    toast.success("Transaksi berhasil diperbarui");
                },
                onError: (err) => {
                    const error = err as AxiosError<{ errors?: { message?: string }, message?: string }>;
                    toast.error(error.response?.data?.errors?.message || error.response?.data?.message || "Gagal memperbarui transaksi");
                }
            });
        } else {
            createCashFlow(payload, {
                onSuccess: () => {
                    handleOpenChange(false);
                    toast.success("Transaksi berhasil dibuat");
                },
                onError: (err) => {
                    const error = err as AxiosError<{ errors?: { message?: string }, message?: string }>;
                    toast.error(error.response?.data?.errors?.message || error.response?.data?.message || "Gagal membuat transaksi");
                }
            });
        }
    };

    const handleEdit = (item: CashFlow) => {
        setEditingItem(item);
        setIsCreateOpen(true);
    };

    // Populate form when detail data arrives
    useEffect(() => {
        if (editingItem) {
            form.reset({
                branchId: editingItem.branchId,
                transactionDate: new Date(editingItem.transactionDate),
                notes: editingItem.notes,
                amount: parseFloat(editingItem.amount),
                type: editingItem.type,
            });
        }
    }, [editingItem, form]);

    // Delete Logic
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const handleDelete = () => {
        if (!deletingId) return;
        deleteCashFlow(deletingId, {
            onSuccess: () => {
                setDeletingId(null);
                toast.success("Transaksi dihapus");
            },
            onError: (err) => {
                const error = err as AxiosError<{ message?: string }>;
                toast.error(error.response?.data?.message || "Gagal menghapus transaksi");
            }
        });
    };

    const columns = useMemo<ColumnDef<CashFlow>[]>(() => [
        {
            accessorKey: "transactionDate",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Tanggal" />
            ),
            cell: ({ row }) => format(new Date(row.original.transactionDate), "dd MMM yyyy", { locale: idLocale }),
        },
        {
            accessorKey: "type",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Tipe" />
            ),
            cell: ({ row }) => (
                <div className={`font-semibold ${row.original.type === "IN" ? "text-green-600" : "text-red-600"}`}>
                    {row.original.type === "IN" ? "KAS MASUK" : "KAS KELUAR"}
                </div>
            ),
        },
        {
            accessorKey: "notes",
            header: () => (
                <div className="text-left">Catatan</div>
            ),
            cell: ({ row }) => <div className="text-left max-w-[300px] truncate">{row.original.notes}</div>,
        },
        {
            accessorKey: "amount",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Jumlah" className="text-right" />
            ),
            cell: ({ row }) => <div className="text-right font-bold">{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(parseFloat(row.original.amount))}</div>,
        },
        {
            id: "actions",
            header: () => <div className="text-right">Aksi</div>,
            cell: ({ row }) => {
                const p = row.original;
                if (!hasAccess) return null;
                return (
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleEdit(p)}>
                            <span className="sr-only">Edit</span>
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600" onClick={() => setDeletingId(p.id)}>
                            <span className="sr-only">Hapus</span>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                );
            },
        },
    ], [hasAccess]);

    const table = useReactTable({
        data: cashFlowData?.data || [],
        columns,
        state: {
            pagination,
            sorting,
            columnVisibility,
        },
        pageCount: cashFlowData?.pagination?.totalPages || -1,
        onPaginationChange: setPagination,
        onSortingChange: setSorting,
        onColumnVisibilityChange: setColumnVisibility,
        getCoreRowModel: getCoreRowModel(),
        manualPagination: true,
        manualSorting: true,
        manualFiltering: true,
    });

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">Arus Kas (Cash Flow)</h2>
                {hasAccess &&
                    <ActionBranchButton onClick={() => handleOpenChange(true)}>
                        Transaksi Baru
                    </ActionBranchButton>
                }
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-[250px]">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Cari Catatan..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                        <span className="text-sm">IN: <span className="font-bold text-green-600">Masuk</span></span>
                        <span className="text-sm">OUT: <span className="font-bold text-red-600">Keluar</span></span>
                    </div>
                    <DatePickerWithRange date={dateRange} setDate={setDateRange} />
                    {dateRange && (
                        <Button variant="ghost" size="icon" onClick={() => setDateRange(undefined)}>
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            {/* List Table */}
            <DataTable
                table={table}
                columnsLength={columns.length}
                isLoading={isLoading}
                showSelectedRowCount={false}
            />

            {/* Create / Edit Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={handleOpenChange}>
                <DialogContent className="max-w-md w-full">
                    <DialogHeader>
                        <DialogTitle>{editingItem ? "Edit Transaksi" : "Buat Transaksi Baru"}</DialogTitle>
                        <DialogDescription>
                            {editingItem ? "Perbarui informasi transaksi di bawah ini." : "Input detail transaksi arus kas."}
                        </DialogDescription>
                    </DialogHeader>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField control={form.control} name="transactionDate" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tanggal Transaksi</FormLabel>
                                    <FormControl>
                                        <Input type="date" value={field.value ? format(field.value, "yyyy-MM-dd") : ""} onChange={e => field.onChange(new Date(e.target.value))} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="type" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tipe Transaksi</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih tipe" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="IN">KAS MASUK</SelectItem>
                                            <SelectItem value="OUT">KAS KELUAR</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="amount" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Jumlah (Rp)</FormLabel>
                                    <FormControl>
                                        <Input type="number" min={0} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="notes" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Catatan</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Contoh: Beli bensin, Donasi, dll." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <div className="flex justify-end pt-4">
                                <Button type="submit" disabled={isCreating || isUpdating}>
                                    {(isCreating || isUpdating) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Simpan
                                </Button>
                            </div>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <Dialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Apakah anda yakin?</DialogTitle>
                        <DialogDescription>
                            Tindakan ini tidak dapat dibatalkan. Transaksi ini akan dihapus secara permanen.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="outline" onClick={() => setDeletingId(null)}>Batal</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Hapus
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}