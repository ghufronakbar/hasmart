"use client";

import { useMemo, useState, useEffect, useRef } from "react";
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
import {
    ColumnDef,
    getCoreRowModel,
    useReactTable,
    SortingState,
    VisibilityState,
    PaginationState,
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



import {
    useAdjustStocks,
    useAdjustStock,
    useCreateAdjustStock,
    useDeleteAdjustStock,
} from "@/hooks/transaction/use-adjust-stock";
import { useItems } from "@/hooks/master/use-item";
import { itemService } from "@/services/master/item.service";
import { useBranch } from "@/providers/branch-provider";
import { useDebounce } from "@/hooks/use-debounce";
import { TransactionAdjustment } from "@/types/transaction/adjust-stock";
import { Item, ItemVariant } from "@/types/master/item";
import { DataTable } from "@/components/ui/data-table/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table/data-table-column-header";

import { DatePickerWithRange } from "@/components/custom/date-picker-with-range";
import { Combobox } from "@/components/custom/combobox";
import { ActionBranchButton } from "@/components/custom/action-branch-button";
import { useAccessControl, UserAccess } from "@/hooks/use-access-control";
import { useF2 } from "@/hooks/function/use-f2";

// --- Types & Schemas ---

const createAdjustStockSchema = z.object({
    transactionDate: z.date(),
    notes: z.string().optional(),
    branchId: z.number(),
    items: z.array(z.object({
        masterItemId: z.number().min(1, "Barang wajib dipilih"),
        masterItemVariantId: z.number().min(1, "Variant wajib dipilih"),
        actualQty: z.number().min(0, "Qty fisik wajib diisi (>= 0)"),
    })).min(1, "Minimal pilih 1 item"),
}).refine((data) => {
    // Unique variant check
    const variantIds = data.items.map(i => i.masterItemVariantId);
    const uniqueIds = new Set(variantIds);
    return variantIds.length === uniqueIds.size;
}, {
    message: "Terdapat item variant yang sama (duplikat)",
    path: ["items"],
});

type CreateAdjustStockFormValues = z.infer<typeof createAdjustStockSchema>;

export default function AdjustStockPage() {
    useAccessControl([UserAccess.accessTransactionAdjustmentRead], true);
    const hasAccess = useAccessControl([UserAccess.accessTransactionAdjustmentWrite], false);
    const { branch } = useBranch();
    const [search, setSearch] = useState("");
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: 10,
    });
    const [sorting, setSorting] = useState<SortingState>([{
        id: "transactionDate",
        desc: true,
    }]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

    const debouncedSearch = useDebounce(search, 500);

    // Barcode Scanning State
    const barcodeInputRef = useRef<HTMLInputElement>(null);
    const [isScanning, setIsScanning] = useState(false);

    // --- Search & Cache States ---
    const [searchItem, setSearchItem] = useState("");
    const debouncedSearchItem = useDebounce(searchItem, 200);
    // Standardizing on cachedItems pattern like other transaction pages
    const [cachedItems, setCachedItems] = useState<Item[]>([]);

    // Queries
    const { data: adjustments, isLoading } = useAdjustStocks({
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        search: debouncedSearch,
        sort: sorting[0]?.desc ? "desc" : "asc",
        sortBy: sorting[0]?.id,
        dateStart: dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
        dateEnd: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
        branchId: branch?.id,
    });

    const createMutation = useCreateAdjustStock();
    const deleteMutation = useDeleteAdjustStock();

    // State
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [detailId, setDetailId] = useState<number | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    // Fetch Detail
    const { data: detailData, isLoading: isDetailLoading } = useAdjustStock(detailId);

    // Form
    const form = useForm<CreateAdjustStockFormValues>({
        resolver: zodResolver(createAdjustStockSchema),
        defaultValues: {
            transactionDate: new Date(),
            notes: "",
            branchId: branch?.id || 0,
            items: [],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "items",
    });

    useModEnter(() => handleNewItem());

    const watchedItems = useWatch({ control: form.control, name: "items" });

    // Derive idNotIns from watched items
    const idNotIns = useMemo(() => {
        const ids = watchedItems?.map(i => i.masterItemId).filter(id => id > 0) || [];
        // Unique IDs only
        return Array.from(new Set(ids)).join(",");
    }, [watchedItems]);

    // Update branchId when branch context changes
    const watchedBranchId = useWatch({ control: form.control, name: "branchId" });
    if (branch?.id && watchedBranchId !== branch.id) {
        form.setValue("branchId", branch.id);
    }

    // --- Detail View Handling ---
    const handleViewDetail = (id: number) => {
        setDetailId(id);
        setIsCreateOpen(true);
    };

    // Focus management for new items
    const [focusTarget, setFocusTarget] = useState<{ index: number, type: 'item' | 'qty' } | null>(null);
    const [focusTrigger, setFocusTrigger] = useState(0);

    useEffect(() => {
        if (focusTarget !== null) {
            setTimeout(() => {
                if (focusTarget.type === 'item') {
                    const element = document.getElementById(`item-select-${focusTarget.index}`);
                    element?.focus();
                } else if (focusTarget.type === 'qty') {
                    const element = document.getElementById(`qty-input-${focusTarget.index}`) as HTMLInputElement;
                    if (element) {
                        element.focus();
                        element.select();
                    }
                }
            }, 50);
        }
    }, [focusTarget, focusTrigger, fields.length]);

    const handleNewItem = () => {
        append({ masterItemId: 0, masterItemVariantId: 0, actualQty: 0 });
        setFocusTarget({ index: fields.length, type: 'item' });
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
                    setCachedItems(prev => {
                        if (prev.find(i => i.id === item.id)) return prev;
                        return [...prev, item];
                    });

                    // Check if item already exists in list
                    const currentItems = form.getValues("items");

                    const exactMatchIndex = currentItems.findIndex(
                        line => line.masterItemId === item.id && line.masterItemVariantId === baseVariant.id
                    );

                    if (exactMatchIndex >= 0) {
                        // EXACT MATCH: Focus Only
                        setFocusTarget({ index: exactMatchIndex, type: 'qty' });
                        setFocusTrigger(prev => prev + 1);
                        toast.success(`${item.name} sudah ada`);
                    } else {
                        const itemMatchIndex = currentItems.findIndex(
                            line => line.masterItemId === item.id
                        );

                        if (itemMatchIndex >= 0) {
                            // PARTIAL MATCH: Focus Only
                            setFocusTarget({ index: itemMatchIndex, type: 'qty' });
                            setFocusTrigger(prev => prev + 1);
                            toast.info(`${item.name} sudah ada`);
                        } else {
                            // NO MATCH: Append New Item
                            append({
                                masterItemId: item.id,
                                masterItemVariantId: baseVariant.id,
                                actualQty: 1
                            });

                            setFocusTarget({ index: fields.length, type: 'qty' });
                            setFocusTrigger(prev => prev + 1);
                            toast.success(`${item.name} ditambahkan`);
                        }
                    }
                } else {
                    toast.error("Item tidak ditemukan");
                }
            } catch (error) {
                console.error(error);
                toast.error("Kode tidak ditemukan atau terjadi kesalahan");
            } finally {
                setIsScanning(false);
            }
        }
    };

    useF2(() => {
        barcodeInputRef.current?.focus();
    });

    const handleCreate = () => {
        setDetailId(null);
        form.reset({
            transactionDate: new Date(),
            notes: "",
            branchId: branch?.id || 0,
            items: [],
        });
        // We do NOT use handleNewItem here because the dialog transition might interfere with focus
        // OR we can, but let's stick to simple append for initial open.
        // Actually, for consistency, let's just append. Focus might be lost to dialog open anyway.
        append({ masterItemId: 0, masterItemVariantId: 0, actualQty: 0 });
        setIsCreateOpen(true);
    };

    const handleOpenChange = (open: boolean) => {
        setIsCreateOpen(open);
        if (!open) {
            setDetailId(null);
            setSearchItem("");
            form.reset();
        }
    };

    // Populate form for Detail View (Read-only)
    // NOTE: For detail view, we map data to form just for display consistent UI
    // But since schema is rigid about creation (actualQty), and detail response has more fields (gap, currentStock),
    // we might need to be careful. However, since we disable inputs, it's mostly for visuals.
    // Actually, detail view usually shows MORE info (Current Stock, Gap).
    // The create form intentionally HIDES Current Stock/Gap to force blind count.
    // So reusing the EXACT same form might be tricky if we want to show calculated gaps.
    // Strategy: Use the same Dialog, but render a different content for Detail vs Create if structure diverges significantly.
    // Or, add read-only fields to the form array?
    // Let's stick to simple form reuse first, maybe mapped to notes?
    // BETTER: If detailId is set, show a custom Detail View table instead of the FormField array.

    // --- Items Query ---
    const { data: items } = useItems({
        limit: 20,
        search: debouncedSearchItem,
        sortBy: "name",
        sort: "asc",
        idNotIns, // Exclude selected items
    });

    // Accumulate items from useItems and detail into cache
    useEffect(() => {
        const fetchedItems = items?.data;
        if (fetchedItems && fetchedItems.length > 0) {
            setCachedItems(prev => {
                const map = new Map(prev.map(i => [i.id, i]));
                fetchedItems.forEach(item => {
                    const existing = map.get(item.id);
                    if (!existing) {
                        map.set(item.id, item);
                    } else {
                        const existingVariantCount = existing.masterItemVariants?.length || 0;
                        const newVariantCount = item.masterItemVariants?.length || 0;
                        if (newVariantCount > existingVariantCount) {
                            map.set(item.id, item);
                        }
                    }
                });
                return Array.from(map.values());
            });
        }
    }, [items?.data]);

    // Also cache items from detail data
    useEffect(() => {
        if (detailData?.data?.items) {
            const detailItems = detailData.data.items.map(i => i.masterItem).filter((i): i is Item => !!i);
            if (detailItems.length > 0) {
                setCachedItems(prev => {
                    const map = new Map(prev.map(i => [i.id, i]));
                    detailItems.forEach(item => {
                        if (!map.has(item.id)) map.set(item.id, item);
                    });
                    return Array.from(map.values());
                });
            }
        }
    }, [detailData]);

    const itemOptions = useMemo(() => {
        const listItems = items?.data || [];
        const map = new Map();

        const addOrMergeItem = (item: Item) => {
            if (!item || !item.id) return;
            const existing = map.get(item.id);
            if (!existing) {
                map.set(item.id, item);
            } else {
                const existingVariantCount = existing.masterItemVariants?.length || 0;
                const newVariantCount = item.masterItemVariants?.length || 0;
                if (newVariantCount > existingVariantCount) {
                    map.set(item.id, item);
                }
            }
        };

        cachedItems.forEach(addOrMergeItem);
        listItems.forEach(addOrMergeItem);

        return Array.from(map.values());
    }, [cachedItems, items?.data]);

    // Update cache on selection - simplified
    const handleItemSelect = (index: number, itemId: number) => {
        form.setValue(`items.${index}.masterItemId`, itemId);
        form.setValue(`items.${index}.masterItemVariantId`, 0); // Reset variant
    };

    // Submit
    const onSubmit = (values: CreateAdjustStockFormValues) => {
        createMutation.mutate(values, {
            onSuccess: () => {
                setIsCreateOpen(false);
            },
        });
    };

    const onDelete = () => {
        if (deleteId) {
            deleteMutation.mutate(deleteId, {
                onSuccess: () => setDeleteId(null),
            });
        }
    };

    // Columns
    const columns: ColumnDef<TransactionAdjustment>[] = [
        {
            accessorKey: "transactionDate",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            header: ({ column }: any) => (
                <DataTableColumnHeader column={column} title="Tanggal" />
            ),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            cell: ({ row }: any) => {
                const date = new Date(row.original.transactionDate);
                return isNaN(date.getTime()) ? "-" : format(date, "dd MMM yyyy HH:mm", { locale: idLocale });
            },
        },
        {
            accessorKey: "masterItem.name",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            header: ({ column }: any) => (
                <DataTableColumnHeader column={column} title="Barang" />
            ),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            cell: ({ row }: any) => (
                <div className="flex flex-col">
                    <span className="font-medium">{row.original.masterItem?.name}</span>
                    <span className="text-xs text-muted-foreground">{row.original.masterItemVariant?.code}</span>
                </div>
            )
        },
        {
            id: "gap",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            header: ({ column }: any) => (
                <DataTableColumnHeader column={column} title="Selisih" className="text-right" />
            ),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            cell: ({ row }: any) => {
                const gap = row.original.totalGapAmount
                return (
                    <div className={cn("text-right font-mono font-bold", gap > 0 ? "text-green-600" : gap < 0 ? "text-red-600" : "text-muted-foreground")}>
                        {gap > 0 ? "+" : ""}{gap}
                    </div>
                );
            }
        },
        {
            accessorKey: "finalAmount",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            header: ({ column }: any) => (
                <DataTableColumnHeader column={column} title="Total Penyesuaian" className="text-right" />
            ),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            cell: ({ row }: any) => (
                <div className="text-right font-mono font-bold">
                    {row.original.finalAmount} {row.original.masterItemVariant?.unit} ({row.original.finalTotalAmount})
                </div>
            )
        },
        {
            accessorKey: "notes",
            header: "Catatan",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            cell: ({ row }: any) => <span className="text-muted-foreground italic truncate max-w-[200px] block">{row.original.notes || "-"}</span>
        },
        {
            id: "actions",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            cell: ({ row }: any) => (
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleViewDetail(row.original.id)}>
                        <Eye className="h-4 w-4 text-blue-500" />
                    </Button>
                    {hasAccess &&
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(row.original.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                    }
                </div>
            ),
        },
    ];

    const table = useReactTable({
        data: adjustments?.data || [],
        columns,
        state: {
            pagination,
            sorting,
            columnVisibility,
        },
        pageCount: adjustments?.pagination?.totalPages || -1,
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
                <h2 className="text-2xl font-bold tracking-tight">Penyesuaian Stok</h2>
                {hasAccess &&
                    <ActionBranchButton onClick={handleCreate}>
                        Penyesuaian Stok Baru
                    </ActionBranchButton>
                }
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-[250px]">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Cari transaksi..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <DatePickerWithRange date={dateRange} setDate={setDateRange} />
                    {dateRange && (
                        <Button variant="ghost" size="icon" onClick={() => setDateRange(undefined)}>
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            <DataTable
                table={table}
                columnsLength={columns.length}
                isLoading={isLoading}
                showSelectedRowCount={false}
            />

            {/* Pagination Controls could be added here similar to DataTable component */}

            {/* Create / Detail Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={handleOpenChange}>
                <DialogContent className="max-w-4xl! max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{detailId ? "Detail Penyesuaian Stok" : "Penyesuaian Stok Baru"}</DialogTitle>
                        <DialogDescription>
                            {detailId ? "Informasi detail penyesuaian stok." : "Input jumlah fisik barang. Sistem akan menghitung selisih stok otomatis."}
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
                                    <span>{detailData.data?.transactionDate ? format(new Date(detailData.data.transactionDate), "dd MMMM yyyy HH:mm", { locale: idLocale }) : "-"}</span>
                                </div>
                                <div>
                                    <span className="font-semibold block">Barang</span>
                                    <span>{detailData.data?.masterItem?.name}</span>
                                </div>
                                <div>
                                    <span className="font-semibold block">Variant</span>
                                    <span>{detailData.data?.masterItemVariant?.unit} ({detailData.data?.masterItemVariant?.amount})</span>
                                </div>
                                <div>
                                    <span className="font-semibold block">Stok Awal</span>
                                    <span>{detailData.data?.beforeAmount}</span>
                                </div>
                                <div>
                                    <span className="font-semibold block">Stok Fisik (Akhir)</span>
                                    <span>{detailData.data?.finalAmount} {detailData.data?.masterItemVariant?.unit} ({detailData.data?.finalTotalAmount})</span>
                                </div>
                                <div>
                                    <span className="font-semibold block">Selisih</span>
                                    {(() => {
                                        const gap = (detailData.data?.totalGapAmount || 0);
                                        return (
                                            <span className={cn("font-bold", gap > 0 ? "text-green-600" : gap < 0 ? "text-red-600" : "text-muted-foreground")}>
                                                {gap > 0 ? "+" : ""}{gap}
                                            </span>
                                        );
                                    })()}
                                </div>
                                <div className="col-span-2">
                                    <span className="font-semibold block">Catatan</span>
                                    <p className="bg-muted p-2 rounded-md italic">{detailData.data?.notes || "-"}</p>
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

                                <div className="space-y-2">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex flex-col items-start gap-2">
                                            <h3 className="text-lg font-semibold">Item Barang</h3>
                                            <div className="relative">
                                                <Input
                                                    ref={barcodeInputRef}
                                                    placeholder="Scan Barcode"
                                                    className="h-10 text-sm font-mono border-primary/50 focus-visible:ring-primary pl-9"
                                                    onKeyDown={handleScan}
                                                    disabled={isScanning}
                                                />
                                                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                                                    {isScanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                                </div>
                                            </div>
                                            <span className="text-xs text-muted-foreground">atau tekan F2 untuk fokus</span>
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
                                            const selectedItem = itemOptions.find(i => i.id === selectedItemId);
                                            const variants = selectedItem?.masterItemVariants || [];


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
                                                                    options={itemOptions}
                                                                    placeholder="Pilih Barang"
                                                                    className="w-full"
                                                                    inputValue={searchItem}
                                                                    onInputChange={setSearchItem}
                                                                    renderLabel={(item) => <div className="flex flex-col"><span className="font-semibold">{item.name}</span></div>}
                                                                    filterString={searchItem}
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
                                                                        {variants.map((v: ItemVariant) => (
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
                                                        <FormField control={form.control} name={`items.${index}.actualQty`} render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel className="text-xs font-bold text-primary">Total Fisik</FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        type="number"
                                                                        min="0"
                                                                        {...field}
                                                                        id={`qty-input-${index}`}
                                                                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                                                        onKeyDown={(e) => {
                                                                            if (e.key === "Enter") {
                                                                                e.preventDefault();
                                                                                barcodeInputRef.current?.focus();
                                                                            }
                                                                        }}
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )} />
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>

                                    {form.formState.errors.items?.root && (
                                        <p className="text-sm text-red-500 font-medium bg-red-50 p-2 rounded border border-red-200">
                                            {form.formState.errors.items.root.message}
                                        </p>
                                    )}
                                </div>

                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Batal</Button>
                                    <Button type="submit" disabled={createMutation.isPending}>
                                        {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Simpan
                                    </Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    )}
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Batalkan Penyesuaian Stok?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tindakan ini akan mengembalikan stok barang ke kondisi sebelum penyesuaian. Data yang dihapus tidak dapat dikembalikan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={onDelete} className="bg-red-600 hover:bg-red-700">
                            {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ya, Hapus"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
