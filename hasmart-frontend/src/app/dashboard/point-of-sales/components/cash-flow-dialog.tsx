"use client";

import { useMemo, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
    Loader2,
    Trash2,
    Pencil,
    Plus,
} from "lucide-react";
import { toast } from "sonner";
import {
    useReactTable,
    getCoreRowModel,
    ColumnDef,
} from "@tanstack/react-table";
import { AxiosError } from "axios";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

import {
    useCashFlows,
    useCreateCashFlow,
    useUpdateCashFlow,
    useDeleteCashFlow,
} from "@/hooks/transaction/use-cash-flow";
import { CashFlow, CreateCashFlowDTO, UpdateCashFlowDTO } from "@/types/transaction/cash-flow";
import { useBranch } from "@/providers/branch-provider";

// --- Schema ---
const cashFlowSchema = z.object({
    branchId: z.coerce.number().min(1, "Branch wajib"),
    notes: z.string().min(1, "Catatan wajib diisi"),
    amount: z.coerce.number().min(1, "Jumlah harus lebih dari 0"),
    type: z.enum(["IN", "OUT"], { message: "Tipe wajib dipilih" }),
    transactionDate: z.date(),
});

type CashFlowFormValues = z.infer<typeof cashFlowSchema>;

interface CashFlowDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CashFlowDialog({ open, onOpenChange }: CashFlowDialogProps) {
    const { branch } = useBranch();

    // We only show TODAY's data
    const todayStr = format(new Date(), "yyyy-MM-dd");

    const { data: cashFlowData, isLoading } = useCashFlows({
        page: 1,
        limit: 100, // Show all for today (reasonable limit)
        sort: "desc",
        sortBy: "transactionDate",
        dateStart: todayStr,
        dateEnd: todayStr,
    }, { enabled: open }); // Only fetch when open

    const { mutate: createCashFlow, isPending: isCreating } = useCreateCashFlow();
    const { mutate: updateCashFlow, isPending: isUpdating } = useUpdateCashFlow();
    const { mutate: deleteCashFlow, isPending: isDeleting } = useDeleteCashFlow();

    // --- State for Create/Edit Logic (Nested) ---
    // Instead of nested dialogs (which can be tricky with focus management),
    // we'll switch the VIEW inside this dialog.
    const [view, setView] = useState<"LIST" | "FORM">("LIST");
    const [editingItem, setEditingItem] = useState<CashFlow | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    // Reset when main dialog closes
    useEffect(() => {
        if (!open) {
            setView("LIST");
            setEditingItem(null);
            setDeletingId(null);
        }
    }, [open]);

    // --- Form ---
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

    // Ensure branchId
    useEffect(() => {
        if (branch?.id) form.setValue("branchId", branch.id);
    }, [branch, form]);

    const handleAddNew = () => {
        setEditingItem(null);
        form.reset({
            branchId: branch?.id || 0,
            transactionDate: new Date(),
            notes: "",
            amount: 0,
            type: "OUT",
        });
        setView("FORM");
    };

    const handleEdit = (item: CashFlow) => {
        setEditingItem(item);
        form.reset({
            branchId: item.branchId,
            transactionDate: new Date(item.transactionDate),
            notes: item.notes,
            amount: parseFloat(item.amount),
            type: item.type,
        });
        setView("FORM");
    };

    const handleCancelForm = () => {
        setView("LIST");
        setEditingItem(null);
    };

    const onSubmit = (values: CashFlowFormValues) => {
        const payload: CreateCashFlowDTO | UpdateCashFlowDTO = {
            ...values,
            transactionDate: values.transactionDate.toISOString(),
        };

        if (editingItem) {
            updateCashFlow({ id: editingItem.id, data: payload }, {
                onSuccess: () => {
                    toast.success("Berhasil diperbarui");
                    setView("LIST");
                },
                onError: (err) => {
                    const error = err as AxiosError<{ errors?: { message?: string }, message?: string }>;
                    toast.error(error.response?.data?.errors?.message || error.response?.data?.message || "Gagal memperbarui");
                }
            });
        } else {
            createCashFlow(payload, {
                onSuccess: () => {
                    toast.success("Berhasil dibuat");
                    setView("LIST");
                },
                onError: (err) => {
                    const error = err as AxiosError<{ errors?: { message?: string }, message?: string }>;
                    toast.error(error.response?.data?.errors?.message || error.response?.data?.message || "Gagal membuat");
                }
            });
        }
    };

    const handleDelete = () => {
        if (!deletingId) return;
        deleteCashFlow(deletingId, {
            onSuccess: () => {
                setDeletingId(null);
                toast.success("Dihapus");
            },
            onError: (err) => {
                const error = err as AxiosError<{ message?: string }>;
                toast.error(error.response?.data?.message || "Gagal menghapus");
            }
        });
    };

    // --- Table ---
    const columns = useMemo<ColumnDef<CashFlow>[]>(() => [
        {
            accessorKey: "type",
            header: () => (
                <div className="text-center">Tipe</div>
            ),
            cell: ({ row }) => (
                <div className={`font-semibold text-center ${row.original.type === "IN" ? "text-green-600" : "text-red-600"}`}>
                    {row.original.type}
                </div>
            ),
        },
        {
            accessorKey: "notes",
            header: "Keterangan",
            cell: ({ row }) => <div className="max-w-[200px] truncate">{row.original.notes}</div>,
        },
        {
            accessorKey: "amount",
            header: () => (
                <div className="text-right">Jumlah</div>
            ),
            cell: ({ row }) => <div className="text-right font-bold">{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(parseFloat(row.original.amount))}</div>,
        },
        {
            id: "actions",
            header: "",
            cell: ({ row }) => {
                const item = row.original;
                return (
                    <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(item)}>
                            <Pencil className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600" onClick={() => setDeletingId(item.id)}>
                            <Trash2 className="h-3 w-3" />
                        </Button>
                    </div>
                );
            },
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
    ], []);

    const table = useReactTable({
        data: cashFlowData?.data || [],
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl! w-full max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{view === "LIST" ? "Arus Kas Hari Ini" : (editingItem ? "Edit Arus Kas" : "Tambah Arus Kas")}</DialogTitle>
                    <DialogDescription>
                        {view === "LIST" ? `Data arus kas untuk tanggal ${format(new Date(), "dd MMM yyyy", { locale: idLocale })}` : "Isi form di bawah ini."}
                    </DialogDescription>
                </DialogHeader>

                {view === "LIST" ? (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center bg-muted/20 p-2 rounded">
                            <div className="flex gap-4 text-sm">
                                <div>Total Masuk: <span className="font-bold text-green-600">
                                    {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(
                                        (cashFlowData?.data || [])
                                            .filter(i => i.type === "IN")
                                            .reduce((acc, curr) => acc + parseFloat(curr.amount), 0)
                                    )}
                                </span></div>
                                <div>Total Keluar: <span className="font-bold text-red-600">
                                    {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(
                                        (cashFlowData?.data || [])
                                            .filter(i => i.type === "OUT")
                                            .reduce((acc, curr) => acc + parseFloat(curr.amount), 0)
                                    )}
                                </span></div>
                            </div>
                            <Button size="sm" onClick={handleAddNew}>
                                <Plus className="mr-1 h-3 w-3" /> Tambah
                            </Button>
                        </div>

                        <DataTable
                            table={table}
                            columnsLength={columns.length}
                            isLoading={isLoading}
                            showSelectedRowCount={false}
                        />

                        {/* Delete Confirmation Alert (Nested inside Dialog Content?) 
                            Ideally, we should use a separate Dialog or AlertDialog.
                            But since we are already in a Dialog, let's use a small inline confirmation or replace view.
                        */}
                        {deletingId && (
                            <div className="mt-4 p-4 border border-red-200 bg-red-50 rounded-lg animate-in fade-in">
                                <p className="text-sm font-medium text-red-800 mb-2">Hapus data ini?</p>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => setDeletingId(null)} className="h-7 text-xs bg-white">Batal</Button>
                                    <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isDeleting} className="h-7 text-xs">
                                        {isDeleting && <Loader2 className="mr-1 h-3 w-3 animate-spin" />} Hapus
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                            {/* Only showing essential fields for POS speed */}
                            <FormField control={form.control} name="type" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tipe</FormLabel>
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
                                        <Input type="number" min={0} {...field} className="text-lg font-bold" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="notes" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Keterangan</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Keterangan..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            {/* Hidden Date (Always Today) */}

                            <div className="flex justify-end gap-2 pt-2">
                                <Button type="button" variant="ghost" onClick={handleCancelForm}>Batal</Button>
                                <Button type="submit" disabled={isCreating || isUpdating}>
                                    {(isCreating || isUpdating) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Simpan
                                </Button>
                            </div>
                        </form>
                    </Form>
                )}
            </DialogContent>
        </Dialog>
    );
}
