"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useRef } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import {
    Loader2,
    Calendar as CalendarIcon,
    Search,
    Trash2,
    CirclePlus,
    X,
    Eye,
} from "lucide-react";
import { toast } from "sonner";
import { itemService } from "@/services/master/item.service";
import {
    PaginationState,
    useReactTable,
    SortingState,
    VisibilityState,
    getCoreRowModel,
    ColumnDef,
} from "@tanstack/react-table";
import { useModEnter } from "@/hooks/function/use-mod-enter";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
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

} from "@/components/ui/command";
import { DataTable } from "@/components/ui/data-table/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table/data-table-column-header";

import { Textarea } from "@/components/ui/textarea";

import {
    useTransfers,
    useTransfer,
    useCreateTransfer,
    useDeleteTransfer,
} from "@/hooks/transaction/use-transfer";
import { useBranches } from "@/hooks/app/use-branch";
import { useBranch as useBranchContext } from "@/providers/branch-provider";
import { useItems } from "@/hooks/master/use-item";
import { useDebounce } from "@/hooks/use-debounce";
import { Transfer } from "@/types/transaction/transfer";
import { ItemVariant } from "@/types/master/item";
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
import { DatePickerWithRange } from "@/components/custom/date-picker-with-range";
import { Combobox } from "@/components/custom/combobox";
import { ActionBranchButton } from "@/components/custom/action-branch-button";
import { useAccessControl, UserAccess } from "@/hooks/use-access-control";

// --- Schema ---
const createTransferItemSchema = z.object({
    masterItemId: z.coerce.number().min(1, "Barang harus dipilih"),
    masterItemVariantId: z.coerce.number().min(1, "Variant harus dipilih"),
    qty: z.coerce.number().min(1, "Jumlah minimal 1"),
});

const createTransferSchema = z.object({
    transactionDate: z.date({ message: "Tanggal transaksi wajib diisi" }),
    fromId: z.coerce.number().min(1, "Cabang asal wajib dipilih"),
    toId: z.coerce.number().min(1, "Cabang tujuan wajib dipilih"),
    notes: z.string().optional(),
    items: z.array(createTransferItemSchema).min(1, "Minimal 1 barang harus dipilih"),
}).refine((data) => data.fromId !== data.toId, {
    message: "Cabang asal dan tujuan tidak boleh sama",
    path: ["toId"],
});

type CreateTransferFormValues = z.infer<typeof createTransferSchema>;


export default function TransferPage() {
    useAccessControl([UserAccess.accessTransactionTransferRead], true);
    const hasAccess = useAccessControl([UserAccess.accessTransactionTransferWrite], false);
    // Context
    const { branch } = useBranchContext();

    // Hooks
    const createMutation = useCreateTransfer();
    const deleteMutation = useDeleteTransfer();

    // State
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [detailId, setDetailId] = useState<number | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    // List State
    const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
    const [sorting, setSorting] = useState<SortingState>([{
        id: "transactionDate",
        desc: true,
    }]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search, 500);

    // Barcode Scanning State
    const barcodeInputRef = useRef<HTMLInputElement>(null);
    const [isScanning, setIsScanning] = useState(false);

    // --- Combobox Search States ---
    const [searchItem, setSearchItem] = useState("");
    const debouncedSearchItem = useDebounce(searchItem, 200);
    const [selectedItemsCache, setSelectedItemsCache] = useState<Record<number, any>>({}); // Using any for Item type to avoid import hell if not imported

    const [searchBranch, setSearchBranch] = useState("");
    const debouncedSearchBranch = useDebounce(searchBranch, 200);
    const [selectedBranchCache, setSelectedBranchCache] = useState<Record<number, any>>({});

    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

    // Fetch List
    const { data: transfers, isLoading } = useTransfers({
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        search: debouncedSearch,
        sort: sorting.length > 0 ? (sorting[0].desc ? "desc" : "asc") : "desc",
        sortBy: sorting.length > 0 ? sorting[0].id : undefined,
        dateStart: dateRange?.from?.toISOString(),
        dateEnd: dateRange?.to?.toISOString(),
    });

    // Fetch Detail
    const { data: detailData, isLoading: isDetailLoading } = useTransfer(detailId);

    // Fetch Branches (for Select - From Branch)
    // We fetch a basic list for the 'from' branch selector. 
    // Ideally this should be just the current branch if we don't allow changing, 
    // but preserving original logic of fetching list.
    const { data: defaultBranches } = useBranches({ limit: 100 });

    // Fetch Branches (for Combobox - To Branch)
    const { data: toBranches } = useBranches({
        limit: 20,
        search: debouncedSearchBranch,
        sort: "asc",
        sortBy: "name"
    });

    const toBranchesList = toBranches?.data || [];

    // Helper to get branch options (for To Branch)
    const getToBranchOptions = (currentValue: number) => {
        const cached = selectedBranchCache[currentValue];
        if (cached) {
            const exists = toBranchesList.find(b => b.id === cached.id);
            if (!exists) return [cached, ...toBranchesList];
        }
        return toBranchesList;
    };


    // Fetch Items (for Form)
    const { data: items } = useItems({
        limit: 20,
        search: debouncedSearchItem,
        sortBy: "name",
        sort: "asc"
    });

    const itemsList = items?.data || [];

    // Helper to get item options
    const getItemOptions = (currentValue: number) => {
        const cached = selectedItemsCache[currentValue];
        if (cached) {
            const exists = itemsList.find(i => i.id === cached.id);
            if (!exists) return [cached, ...itemsList];
        }
        return itemsList;
    };

    // Update caches when detail loads
    // Update caches when detail loads
    useEffect(() => {
        if (detailData?.data) {
            const d = detailData.data;
            // Cache to branch
            if (d.to && d.to.id) {
                setSelectedBranchCache(prev => ({ ...prev, [d.to!.id]: d.to }));
            }
            // Cache items
            if (d.transactionTransferItems) {
                const newCache = { ...selectedItemsCache };
                let hasChange = false;
                d.transactionTransferItems.forEach((item: any) => {
                    if (item.masterItem && !newCache[item.masterItem.id]) {
                        newCache[item.masterItem.id] = item.masterItem;
                        hasChange = true;
                    }
                });
                if (hasChange) setSelectedItemsCache(newCache);
            }
        }
    }, [detailData, selectedItemsCache]);

    const handleBranchSelect = (branchId: number) => {
        // Find the branch from the combined list of options for 'To Branch'
        const b = getToBranchOptions(form.getValues("toId")).find(b => b.id === branchId);
        if (b) {
            setSelectedBranchCache(prev => ({ ...prev, [b.id]: b }));
        }
        form.setValue("toId", branchId);
    };

    const handleItemSelect = (index: number, itemId: number) => {
        const item = itemsList.find(i => i.id === itemId);
        if (item) {
            setSelectedItemsCache(prev => ({ ...prev, [item.id]: item }));
        }
        form.setValue(`items.${index}.masterItemId`, itemId);
        form.setValue(`items.${index}.masterItemVariantId`, 0); // Reset variant
    };

    // Form
    const form = useForm<CreateTransferFormValues>({
        resolver: zodResolver(createTransferSchema) as any,
        defaultValues: {
            transactionDate: new Date(),
            fromId: branch?.id || 0,
            toId: 0,
            notes: "",
            items: [],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "items",
    });

    useModEnter(() => handleNewItem());

    // Update fromId when branch context changes
    useEffect(() => {
        if (branch?.id) {
            form.setValue("fromId", branch.id);
        }
    }, [branch, form]);

    const watchedItems = useWatch({ control: form.control, name: "items" }) as CreateTransferFormValues["items"];

    // Focus management for new items
    const [lastAddedIndex, setLastAddedIndex] = useState<number | null>(null);

    useEffect(() => {
        if (lastAddedIndex !== null) {
            const element = document.getElementById(`item-select-${lastAddedIndex}`);
            if (element) {
                element.focus();
                // Reset after focusing
                setLastAddedIndex(null);
            }
        }
    }, [lastAddedIndex, fields.length]); // Depend on fields.length to wait for render

    const handleNewItem = () => {
        append({ masterItemId: 0, masterItemVariantId: 0, qty: 1 });
        setLastAddedIndex(fields.length);
    }

    // Handle Barcode Scan
    const handleScan = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            const code = e.currentTarget.value.trim();
            if (!code) return;

            e.preventDefault(); // Prevent form submission
            e.currentTarget.value = ""; // Clear immediately
            setIsScanning(true);

            try {
                // Fetch Item by Code
                const res = await itemService.getItemByCode(code);

                if (res.data) {
                    const item = res.data;

                    if (!item.isActive) {
                        toast.error("Item tidak aktif");
                        return;
                    }

                    // Get base unit variant or first
                    const baseVariant = item.masterItemVariants.find(v => v.isBaseUnit)
                        || item.masterItemVariants[0];

                    if (!baseVariant) {
                        toast.error("Item tidak memiliki variant");
                        return;
                    }

                    // Add to cache to ensure it's valid for Combobox
                    setSelectedItemsCache(prev => ({ ...prev, [item.id]: item }));

                    // Check if item already exists in list (same item & variant)
                    const currentItems = form.getValues("items");
                    const existingIndex = currentItems.findIndex(
                        line => line.masterItemId === item.id && line.masterItemVariantId === baseVariant.id
                    );

                    if (existingIndex >= 0) {
                        // Update Qty
                        const existingItem = currentItems[existingIndex];
                        const newQty = Number(existingItem.qty) + 1;
                        form.setValue(`items.${existingIndex}.qty`, newQty);

                        // Highlight/Focus existing row?
                        setLastAddedIndex(existingIndex);
                        toast.success(`${item.name} (+1)`);
                    } else {
                        // Append new item
                        append({
                            masterItemId: item.id,
                            masterItemVariantId: baseVariant.id,
                            qty: 1
                        });
                        setLastAddedIndex(fields.length); // length will be index of new item
                        toast.success(`${item.name} ditambahkan`);
                    }

                } else {
                    toast.error("Item tidak ditemukan");
                }
            } catch (error) {
                console.error(error);
                toast.error("Kode tidak ditemukan atau terjadi kesalahan");
            } finally {
                setIsScanning(false);
                // Keep focus
                barcodeInputRef.current?.focus();
            }
        }
    };

    // Handlers
    const handleCreate = () => {
        setDetailId(null);
        form.reset({
            transactionDate: new Date(),
            fromId: branch?.id || 0,
            toId: 0,
            notes: "",
            items: [],
        });
        // Start with 1 empty row. Logic for focus not needed on fresh open.
        append({ masterItemId: 0, masterItemVariantId: 0, qty: 0 });
        setIsCreateOpen(true);
    };

    const handleOpenChange = (open: boolean) => {
        setIsCreateOpen(open);
        if (!open) {
            setDetailId(null);
            setSearchItem("");
            setSearchBranch("");
            form.reset();
        }
    };

    const handleViewDetail = (id: number) => {
        setDetailId(id);
        setIsCreateOpen(true);
    };

    const handleDelete = () => {
        if (deleteId) {
            deleteMutation.mutate(deleteId, {
                onSuccess: () => setDeleteId(null),
            });
        }
    };

    const onSubmit = (values: CreateTransferFormValues) => {
        createMutation.mutate(values, {
            onSuccess: () => {
                setIsCreateOpen(false);
                form.reset();
            },
        });
    };




    // Columns
    const columns: ColumnDef<Transfer>[] = [
        {
            accessorKey: "transactionDate",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Tanggal" />
            ),
            cell: ({ row }) => {
                const date = new Date(row.original.transactionDate);
                return isNaN(date.getTime()) ? "-" : format(date, "dd MMM yyyy", { locale: idLocale });
            },
        },
        {
            accessorKey: "from.name",
            header: "Dari Cabang",
            cell: ({ row }) => row.original.from?.name || "-",
        },
        {
            accessorKey: "to.name",
            header: "Ke Cabang",
            cell: ({ row }) => row.original.to?.name || "-",
        },
        {
            header: "Total Item",
            cell: ({ row }) => row.original.transactionTransferItems?.length || 0,
        },
        {
            accessorKey: "notes",
            header: "Catatan",
            cell: ({ row }) => <span className="text-muted-foreground italic truncate max-w-[150px] block">{row.original.notes || "-"}</span>
        },
        {
            id: "actions",
            cell: ({ row }) => {
                if (!hasAccess) return null;
                return (
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleViewDetail(row.original.id)}>
                            <Eye className="h-4 w-4 text-blue-500" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(row.original.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                    </div>
                )
            }
        },
    ];

    const table = useReactTable({
        data: transfers?.data || [],
        columns,
        state: {
            pagination,
            sorting,
            columnVisibility,
        },
        pageCount: transfers?.pagination?.totalPages || -1,
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
                <h2 className="text-2xl font-bold tracking-tight">Transfer Stok</h2>
                {hasAccess && (
                    <ActionBranchButton onClick={handleCreate}>
                        Transfer Baru
                    </ActionBranchButton>
                )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-[250px]">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Cari transfer..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                </div>
                <DatePickerWithRange
                    date={dateRange}
                    setDate={setDateRange}
                />
            </div>

            <DataTable
                table={table}
                columnsLength={columns.length}
                isLoading={isLoading}
                showSelectedRowCount={false}
            />

            {/* Create / Detail Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={handleOpenChange}>
                <DialogContent className="max-w-4xl! max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{detailId ? "Detail Transfer" : "Transfer Baru"}</DialogTitle>
                        <DialogDescription>
                            {detailId ? "Informasi detail transfer stok." : "Isi form untuk membuat transfer stok antar cabang baru."}
                        </DialogDescription>
                    </DialogHeader>

                    {detailId && isDetailLoading ? (
                        <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
                    ) : detailId && detailData ? (
                        // READ ONLY DETAIL VIEW
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="font-semibold block">Tanggal</span>
                                    <span>{detailData.data?.transactionDate ? format(new Date(detailData.data.transactionDate), "dd MMMM yyyy", { locale: idLocale }) : "-"}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="font-semibold block">Dari Cabang</span>
                                        <span>{detailData.data?.from?.name || "-"}</span>
                                    </div>
                                    <div>
                                        <span className="font-semibold block">Ke Cabang</span>
                                        <span>{detailData.data?.to?.name || "-"}</span>
                                    </div>
                                </div>
                                <div className="col-span-2">
                                    <span className="font-semibold block">Catatan</span>
                                    <p className="bg-muted p-2 rounded-md italic">{detailData.data?.notes || "-"}</p>
                                </div>
                            </div>
                            <div className="border rounded-md">
                                <div className="p-4">
                                    <h4 className="text-sm font-semibold mb-2">Item Transfer</h4>
                                    <div className="relative w-full overflow-auto">
                                        <table className="w-full caption-bottom text-sm">
                                            <thead className="[&_tr]:border-b">
                                                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Barang</th>
                                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Variant</th>
                                                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Qty</th>
                                                </tr>
                                            </thead>
                                            <tbody className="[&_tr:last-child]:border-0">
                                                {detailData.data?.transactionTransferItems?.map((item) => (
                                                    <tr key={item.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                                        <td className="p-4 align-middle">{item.masterItem?.name}</td>
                                                        <td className="p-4 align-middle">{item.masterItemVariant?.unit} ({item.masterItemVariant?.amount})</td>
                                                        <td className="p-4 align-middle text-right font-mono font-bold">{item.qty}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => handleOpenChange(false)}>Tutup</Button>
                            </DialogFooter>
                        </div>
                    ) : (
                        // CREATE FORM
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField control={form.control} name="transactionDate" render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Tanggal Transaksi</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                                            {field.value ? format(field.value, "PPP", { locale: idLocale }) : <span>Pilih tanggal</span>}
                                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date() || date < new Date("1900-01-01")} initialFocus />
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="notes" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Catatan</FormLabel>
                                            <FormControl><Textarea {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField control={form.control} name="fromId" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Dari Cabang</FormLabel>
                                            <Select onValueChange={(val) => field.onChange(parseInt(val))} value={field.value ? field.value.toString() : undefined} disabled>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Pilih Cabang Asal" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {defaultBranches?.data?.map((b) => (
                                                        <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )} />

                                    <FormField control={form.control} name="toId" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Ke Cabang</FormLabel>
                                            <Combobox
                                                value={field.value}
                                                onChange={handleBranchSelect}
                                                options={
                                                    getToBranchOptions(field.value).filter(b => b.id !== form.getValues("fromId"))
                                                }
                                                placeholder="Pilih Cabang Tujuan"
                                                inputValue={searchBranch}
                                                onInputChange={setSearchBranch}
                                                renderLabel={(b) => <span>{b.name}</span>}
                                                className="w-full"
                                            />
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex flex-col items-start gap-2">
                                            <h3 className="text-lg font-semibold">Item Barang</h3>
                                            <div className="relative">
                                                <Input
                                                    ref={barcodeInputRef}
                                                    placeholder="Scan Barcode / Ketik Kode Variant lalu Enter..."
                                                    className="h-10 text-sm font-mono border-primary/50 focus-visible:ring-primary pl-9"
                                                    onKeyDown={handleScan}
                                                    disabled={isScanning}
                                                />
                                                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                                                    {isScanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <div className="flex gap-2">
                                                <Button type="button" size="sm" variant="outline" onClick={handleNewItem}>
                                                    <CirclePlus className="mr-2 h-4 w-4" /> Tambah Barang
                                                </Button>
                                            </div>
                                            <span className="text-muted-foreground text-xs ml-2">Atau tekan Ctrl+Enter</span>
                                        </div>
                                    </div>

                                    {fields.length === 0 && (
                                        <div className="text-center p-8 border border-dashed rounded-lg text-muted-foreground">
                                            Belum ada barang yang di-input.
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        {fields.map((field, index) => {
                                            const selectedItemId = watchedItems?.[index]?.masterItemId;
                                            // Get item details from cache or current list
                                            const selectedItem = itemsList.find(i => i.id === selectedItemId) || selectedItemsCache[selectedItemId];
                                            const variants = selectedItem?.masterItemVariants || [];

                                            // Filter variants: exclude variants selected in other rows
                                            const otherSelectedVariantIds = watchedItems
                                                ?.map((item, i) => (i !== index ? item.masterItemVariantId : null))
                                                .filter((id) => id !== 0 && id != null) || [];

                                            const filteredVariants = variants.filter((v: ItemVariant) => !otherSelectedVariantIds.includes(v.id));

                                            return (
                                                <div key={field.id} className="grid grid-cols-12 gap-4 items-end border p-4 rounded-md relative bg-muted/20">
                                                    <Button type="button" variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6 text-red-500" onClick={() => remove(index)}>
                                                        <X className="h-4 w-4" />
                                                    </Button>

                                                    <div className="col-span-5">
                                                        <FormField control={form.control} name={`items.${index}.masterItemId`} render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel className="text-xs">Barang</FormLabel>
                                                                <Combobox
                                                                    inputId={`item-select-${index}`}
                                                                    value={field.value}
                                                                    onChange={(val) => handleItemSelect(index, val)}
                                                                    options={getItemOptions(field.value)}
                                                                    placeholder="Pilih Barang"
                                                                    inputValue={searchItem}
                                                                    onInputChange={setSearchItem}
                                                                    renderLabel={(item) => <div className="flex flex-col"><span className="font-semibold">{item.name}</span></div>}
                                                                    className="w-full"
                                                                />
                                                                <FormMessage />
                                                            </FormItem>
                                                        )} />
                                                    </div>

                                                    <div className="col-span-4">
                                                        <FormField control={form.control} name={`items.${index}.masterItemVariantId`} render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel className="text-xs">Variant</FormLabel>
                                                                <Select
                                                                    onValueChange={(val) => field.onChange(parseInt(val))}
                                                                    value={field.value ? field.value.toString() : undefined}
                                                                    disabled={!selectedItemId}
                                                                >
                                                                    <FormControl>
                                                                        <SelectTrigger><SelectValue placeholder="Pilih Variant" /></SelectTrigger>
                                                                    </FormControl>
                                                                    <SelectContent>
                                                                        {filteredVariants.map((v: ItemVariant) => (
                                                                            <SelectItem key={v.id} value={v.id.toString()}>
                                                                                {v.unit} ({v.amount})
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )} />
                                                    </div>

                                                    <div className="col-span-3">
                                                        <FormField control={form.control} name={`items.${index}.qty`} render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel className="text-xs">Qty</FormLabel>
                                                                <FormControl>
                                                                    <Input type="number" {...field} min={1} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Batal</Button>
                                    <Button type="submit" disabled={createMutation.isPending || fields.length === 0}>
                                        {createMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                        Simpan
                                    </Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Batalkan Transfer?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tindakan ini akan mengembalikan stok barang ke cabang asal. Data yang dihapus tidak dapat dikembalikan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Tidak</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                            {deleteMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Ya, Batalkan"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

