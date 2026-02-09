"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useForm, useFieldArray, useWatch, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import {
    Loader2,
    Plus,

    Search,
    Trash2,
    CirclePlus,
    X,
    Pencil,
    UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import {
    PaginationState,
    useReactTable,
    SortingState,
    VisibilityState,
    getCoreRowModel,
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
import {
    // Command components removed as they are unused directly (Combobox is used)
} from "@/components/ui/command";
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
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

import {
    useSells,
    useSell,
    useCreateSell,
    useUpdateSell,
    useDeleteSell,
} from "@/hooks/transaction/use-sell";
import { useItems } from "@/hooks/master/use-item";
import { useBranch } from "@/providers/branch-provider";
import { useDebounce } from "@/hooks/use-debounce";
import { useModEnter } from "@/hooks/function/use-mod-enter";
import { memberService } from "@/services/master/member.service";
import { itemService } from "@/services/master/item.service";
import { Member } from "@/types/master/member";
import { Sell, CreateSellDTO } from "@/types/transaction/sell";
import { Item, ItemVariant } from "@/types/master/item";
import { DatePickerWithRange } from "@/components/custom/date-picker-with-range";
import { Combobox } from "@/components/custom/combobox";
import { ActionBranchButton } from "@/components/custom/action-branch-button";
import { useAccessControl, UserAccess } from "@/hooks/use-access-control";
import { useF2 } from "@/hooks/function/use-f2";

// --- Types & Schemas ---

const discountSchema = z.object({
    percentage: z.coerce.number().min(0).max(100),
});

const sellItemSchema = z.object({
    masterItemId: z.coerce.number().min(1, "Item wajib"),
    masterItemVariantId: z.coerce.number().min(1, "Variant wajib"),
    qty: z.coerce.number().min(1, "Qty minimal 1"),
    sellPrice: z.coerce.number().min(0, "Harga jual minimal 0"),
    discounts: z.array(discountSchema).optional(),
});

const createSellSchema = z.object({
    transactionDate: z.date(),
    dueDate: z.date(),
    branchId: z.coerce.number().min(1, "Branch wajib"),
    memberCode: z.string().min(1, "Kode member wajib"),
    notes: z.string().optional(),
    taxPercentage: z.coerce.number().min(0).max(100).default(0),
    items: z.array(sellItemSchema).min(1, "Minimal 1 item"),
    invoiceNumber: z.string().optional(), // Auto generated
});

type CreateSellFormValues = z.infer<typeof createSellSchema>;
type SellItemFormValues = z.infer<typeof sellItemSchema>;



export default function SellPage() {
    useAccessControl([UserAccess.accessTransactionSalesRead], true);
    const hasAccess = useAccessControl([UserAccess.accessTransactionSalesWrite], false);
    const { branch } = useBranch();
    const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });

    const [searchTerm, setSearchTerm] = useState("");
    const [sorting, setSorting] = useState<SortingState>([{
        id: "transactionDate",
        desc: true,
    }]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const debouncedSearch = useDebounce(searchTerm, 500);

    // --- Combobox Search States ---
    const [searchItem, setSearchItem] = useState("");
    const debouncedSearchItem = useDebounce(searchItem, 200);

    // Barcode Scanning State
    const barcodeInputRef = useRef<HTMLInputElement>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [scannedItems, setScannedItems] = useState<Item[]>([]);

    // Date Filter State
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

    // --- Queries ---
    const { data: sellData, isLoading } = useSells({
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        search: debouncedSearch,
        sort: sorting[0]?.desc ? "desc" : "asc",
        sortBy: sorting[0]?.id,
        dateStart: dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
        dateEnd: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
    });



    const { data: items } = useItems({
        limit: 20,
        search: debouncedSearchItem,
        sortBy: "name",
        sort: "asc"
    });

    // Cumulative item cache - stores all items ever fetched to ensure selected items stay visible
    const [cachedItems, setCachedItems] = useState<Item[]>([]);

    // Accumulate items from useItems into cache whenever new items are fetched
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

    const [editingId, setEditingId] = useState<number | null>(null);
    const { data: sellDetail, isLoading: isLoadingDetail } = useSell(editingId);

    // Merge cached items with detail items and scanned items
    const itemOptions = useMemo(() => {
        const detailItems = sellDetail?.data?.items?.map(pi => pi.masterItem).filter((i): i is Item => !!i) || [];

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
        detailItems.forEach(addOrMergeItem);
        scannedItems.forEach(addOrMergeItem);

        return Array.from(map.values());
    }, [cachedItems, sellDetail, scannedItems]);

    const { mutate: createSell, isPending: isCreating } = useCreateSell();
    const { mutate: updateSell, isPending: isUpdating } = useUpdateSell();
    const { mutate: deleteSell, isPending: isDeleting } = useDeleteSell();

    const [memberVerified, setMemberVerified] = useState<Member | null>(null);
    const [isVerifyingMember, setIsVerifyingMember] = useState(false);

    // Reset editingId when dialog closes
    const handleOpenChange = (open: boolean) => {
        setIsCreateOpen(open);
        if (!open) {
            setEditingId(null);
            setMemberVerified(null);
            setSearchItem("");
            form.reset({ branchId: branch?.id, transactionDate: new Date(), dueDate: new Date(), items: [], taxPercentage: 0, memberCode: "" });
        }
    };

    // --- Create Form ---
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const form = useForm<CreateSellFormValues>({
        resolver: zodResolver(createSellSchema) as Resolver<CreateSellFormValues>,
        defaultValues: {
            transactionDate: new Date(),
            dueDate: new Date(),
            branchId: branch?.id || 0,
            notes: "",
            taxPercentage: 0,
            items: [],
            memberCode: "",
        },
    });

    // Ensure branchId is set when branch context loads
    useEffect(() => {
        if (branch?.id) form.setValue("branchId", branch.id);
    }, [branch, form]);

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "items",
    });

    useModEnter(() => handleNewItem());

    const watchedItems = useWatch({ control: form.control, name: "items" }) as SellItemFormValues[];
    const watchedTaxPercentage = useWatch({ control: form.control, name: "taxPercentage" });

    // Handle Member Verification
    const handleVerifyMember = async () => {
        const code = form.getValues("memberCode");
        if (!code) {
            toast.error("Masukkan kode member");
            return;
        }

        setIsVerifyingMember(true);
        try {
            const res = await memberService.getByCode(code.toUpperCase());
            if (res.data) {
                setMemberVerified(res.data);
                toast.success(`Member ditemukan: ${res.data.name}`);
                form.setValue("memberCode", code.toUpperCase()); // Ensure uppercase
            } else {
                setMemberVerified(null);
                toast.error("Member tidak ditemukan");
            }
        } catch {
            setMemberVerified(null);
            toast.error("Member tidak ditemukan");
        } finally {
            setIsVerifyingMember(false);
        }
    };

    // Reset verification logic moved to bottom with edit effect logic
    // to keep related state logic together and avoid spread out conflicts.



    // Helper to add/remove/update discounts manually
    const addDiscount = (itemIndex: number) => {
        const currentItems = form.getValues("items") as SellItemFormValues[];
        const currentDiscounts = currentItems[itemIndex].discounts || [];
        form.setValue(`items.${itemIndex}.discounts`, [...currentDiscounts, { percentage: 0 }]);
    };

    const removeDiscount = (itemIndex: number, discountIndex: number) => {
        const currentItems = form.getValues("items") as SellItemFormValues[];
        const currentDiscounts = currentItems[itemIndex].discounts || [];
        const newDiscounts = currentDiscounts.filter((_, i) => i !== discountIndex);
        form.setValue(`items.${itemIndex}.discounts`, newDiscounts);
    };

    const updateDiscount = (itemIndex: number, discountIndex: number, val: string) => {
        const currentItems = form.getValues("items") as SellItemFormValues[];
        const currentDiscounts = currentItems[itemIndex].discounts || [];
        const newDiscounts = [...currentDiscounts];
        newDiscounts[discountIndex] = { percentage: parseFloat(val) || 0 };
        form.setValue(`items.${itemIndex}.discounts`, newDiscounts);
    };

    // --- Calculations ---
    const calculations = useMemo(() => {
        let subTotal = 0;
        let discountTotal = 0;

        const itemCalculations = watchedItems?.map(item => {
            const qty = Number(item.qty) || 0;
            const price = Number(item.sellPrice) || 0;
            let itemTotal = qty * price;
            let currentDiscount = 0;

            // Cascading discount
            if (item.discounts && item.discounts.length > 0) {
                item.discounts.forEach(d => {
                    const paramsPct = Number(d.percentage) || 0;
                    const discAmount = itemTotal * (paramsPct / 100);
                    currentDiscount += discAmount;
                    itemTotal -= discAmount;
                });
            }

            return {
                netTotal: itemTotal,
                discountAmount: currentDiscount
            };
        });

        watchedItems?.forEach((item, index) => {
            const qty = Number(item.qty) || 0;
            const price = Number(item.sellPrice) || 0;
            subTotal += (qty * price);
            if (itemCalculations?.[index]) {
                discountTotal += itemCalculations[index].discountAmount;
            }
        });

        const taxableAmount = subTotal - discountTotal;
        const taxVal = taxableAmount * ((watchedTaxPercentage || 0) / 100);
        const grandTotal = taxableAmount + taxVal;

        return { subTotal, discountTotal, taxAmount: taxVal, grandTotal, itemCalculations };
    }, [watchedItems, watchedTaxPercentage]);



    const onSubmit = (values: CreateSellFormValues) => {
        // Enforce member verification
        if (!memberVerified || memberVerified.code !== values.memberCode) {
            toast.error("Silakan verifikasi member terlebih dahulu");
            return;
        }

        const payload: CreateSellDTO = {
            ...values,
            transactionDate: values.transactionDate.toISOString(),
            dueDate: values.dueDate.toISOString(),
            taxPercentage: values.taxPercentage,
        };

        if (editingId) {
            updateSell({ id: editingId, data: payload }, {
                onSuccess: () => {
                    handleOpenChange(false);
                    toast.success("Penjualan berhasil diperbarui");
                },
                onError: (err) => {
                    const error = err as AxiosError<{ errors?: { message?: string }, message?: string }>;
                    toast.error(error.response?.data?.errors?.message || error.response?.data?.message || "Gagal memperbarui penjualan");
                }
            });
        } else {
            createSell(payload, {
                onSuccess: () => {
                    handleOpenChange(false);
                    toast.success("Penjualan berhasil dibuat");
                },
                onError: (err) => {
                    const error = err as AxiosError<{ errors?: { message?: string }, message?: string }>;
                    toast.error(error.response?.data?.errors?.message || error.response?.data?.message || "Gagal membuat penjualan");
                }
            });
        }
    };

    const handleEdit = (sell: Sell) => {
        setEditingId(sell.id);
        setIsCreateOpen(true);
    };

    // Populate form when detail data arrives
    useEffect(() => {
        if (editingId && sellDetail?.data) {
            const sell = sellDetail.data;
            const currentItems = sell.items || [];

            // Auto-verify member since it exists in DB
            if (sell.masterMember) {
                setMemberVerified(sell.masterMember);
            }

            const taxPct = parseFloat(String(sell.recordedTaxPercentage ?? sell.taxPercentage ?? 0));

            const formDataVal = {
                transactionDate: new Date(sell.transactionDate),
                dueDate: sell.dueDate ? new Date(sell.dueDate) : new Date(),
                branchId: sell.branchId,
                memberCode: sell.memberCode || sell.masterMember?.code || "",
                notes: sell.notes || "",
                taxPercentage: parseFloat(Number(taxPct).toFixed(2)),
                items: currentItems.map(item => ({
                    masterItemId: item.masterItemId,
                    masterItemVariantId: item.masterItemVariantId,
                    qty: item.qty,
                    sellPrice: parseFloat(String(item.sellPrice || 0)),
                    discounts: item.discounts?.map(d => ({ percentage: parseFloat(d.percentage) })) || []
                }))
            };
            form.reset(formDataVal);
        }
    }, [editingId, sellDetail, form]);


    // --- Item Selection Logic ---
    const handleItemSelect = (index: number, itemId: number) => {
        const item = items?.data?.find(i => i.id === itemId);
        if (item && item.masterItemVariants?.length > 0) {
            form.setValue(`items.${index}.masterItemId`, itemId);
            form.setValue(`items.${index}.masterItemVariantId`, 0); // Reset variant
            form.setValue(`items.${index}.sellPrice`, 0);

            // Use suggested sell price if available (need to check where it comes from, usually variant or item)
            // Assuming item might have a general price or variant. For now just 0 or existing logic?
            // Usually sell price is on variant.
            form.setValue(`items.${index}.discounts`, []);
        }
    };

    const handleVariantSelect = (index: number, variantId: number) => {
        form.setValue(`items.${index}.masterItemVariantId`, variantId);
        // If variant has price, set it
        const itemId = form.getValues(`items.${index}.masterItemId`);
        const item = items?.data?.find(i => i.id === itemId);
        const variant = item?.masterItemVariants?.find(v => v.id === variantId);
        if (variant && variant.sellPrice) {
            form.setValue(`items.${index}.sellPrice`, parseFloat(variant.sellPrice));
        }
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
        append({ masterItemId: 0, masterItemVariantId: 0, qty: 1, sellPrice: 0, discounts: [] });
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

                    // Add to scannedItems so it appears in Combobox options
                    setScannedItems(prev => {
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
                            const itemWithPrice = item
                            const sellPrice = parseFloat(itemWithPrice.masterItemVariants.find(v => v.isBaseUnit)?.sellPrice || "0") || 0;

                            append({
                                masterItemId: item.id,
                                masterItemVariantId: baseVariant.id,
                                qty: 1,
                                sellPrice: sellPrice,
                                discounts: [],
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

    // Delete Logic
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const handleDelete = () => {
        if (!deletingId) return;
        deleteSell(deletingId, {
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

    const columns = useMemo(() => [
        {
            accessorKey: "transactionDate",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            header: ({ column }: any) => (
                <DataTableColumnHeader column={column} title="Tanggal" />
            ),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            cell: ({ row }: any) => format(new Date(row.original.transactionDate), "dd MMM yyyy", { locale: idLocale }),
        },
        {
            accessorKey: "invoiceNumber",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            header: ({ column }: any) => (
                <DataTableColumnHeader column={column} title="Invoice" />
            ),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            cell: ({ row }: any) => <span className="font-medium">{row.original.invoiceNumber}</span>,
        },
        {
            accessorKey: "masterMember.name",
            id: "masterMemberName",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            header: ({ column }: any) => (
                <DataTableColumnHeader column={column} title="Member" />
            ),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            cell: ({ row }: any) => (
                <div className="flex flex-col">
                    <span>{row.original.memberCode}</span>
                    <span className="text-xs text-muted-foreground">{row.original.masterMember?.name}</span>
                </div>
            ),
        },
        {
            accessorKey: "dueDate",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            header: ({ column }: any) => (
                <DataTableColumnHeader column={column} title="Jatuh Tempo" />
            ),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            cell: ({ row }: any) => row.original.dueDate ? format(new Date(row.original.dueDate), "dd/MM/yyyy") : "-",
        },
        {
            accessorKey: "recordedTotalAmount",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            header: ({ column }: any) => (
                <DataTableColumnHeader column={column} title="Total" className="text-right" />
            ),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            cell: ({ row }: any) => <div className="text-right font-bold">{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(parseFloat(row.original.recordedTotalAmount))}</div>,
        },
        {
            accessorKey: "notes",
            header: () => (
                <div className="text-left">Catatan</div>
            ),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            cell: ({ row }: any) => <div className="text-left max-w-[200px] truncate">{row.original.notes || "-"}</div>,
        },
        {
            id: "actions",
            header: () => <div className="text-right">Aksi</div>,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            cell: ({ row }: any) => {
                const s = row.original;
                if (!hasAccess) return null;
                return (
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleEdit(s)}>
                            <span className="sr-only">Edit</span>
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600" onClick={() => setDeletingId(s.id)}>
                            <span className="sr-only">Hapus</span>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                );
            },
        },
    ], [hasAccess]);

    const table = useReactTable({
        data: sellData?.data || [],
        columns,
        state: {
            pagination,
            sorting,
            columnVisibility,
        },
        pageCount: sellData?.pagination?.totalPages || -1,
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
                <h2 className="text-2xl font-bold tracking-tight">Transaksi Penjualan (B2B)</h2>
                {hasAccess && (
                    <ActionBranchButton onClick={() => handleOpenChange(true)}>
                        Penjualan Baru
                    </ActionBranchButton>
                )}
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-[250px]">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Cari Invoice / Catatan..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
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

            {/* List Table */}
            <DataTable
                table={table}
                columnsLength={columns.length}
                isLoading={isLoading}
                showSelectedRowCount={false}
            />


            {/* Create / Edit Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={handleOpenChange}>
                <DialogContent className="max-w-[80vw]! w-full h-[95vh] flex flex-col p-0 gap-0">
                    <DialogHeader className="p-6 pb-2 border-b shrink-0">
                        <div className="flex items-center justify-between">
                            <div>
                                <DialogTitle>{editingId ? "Edit Penjualan B2B" : "Buat Penjualan Baru (B2B)"}</DialogTitle>
                                <DialogDescription>
                                    {editingId ? "Perbarui informasi penjualan di bawah ini." : "Input detail penjualan grosir ke member."}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    {editingId && isLoadingDetail ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="h-8 w-8 animate-spin" />
                            <span className="ml-2">Memuat data transaksi...</span>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto p-6">
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                                    {/* Header Info */}
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-4 border rounded-lg bg-slate-50 items-start">
                                        {/* Member Verification Section */}
                                        <div className="col-span-2">
                                            <FormField control={form.control} name="memberCode" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Kode Member (Wajib)</FormLabel>
                                                    <div className="flex gap-2">
                                                        <FormControl>
                                                            <Input
                                                                placeholder="MBR-XXX"
                                                                {...field}
                                                                // Convert to uppercase on change
                                                                onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                                                                disabled={!!editingId} // Usually cannot change member on edit
                                                            />
                                                        </FormControl>
                                                        {!editingId && (
                                                            <Button
                                                                type="button"
                                                                variant={memberVerified ? "outline" : "default"}
                                                                onClick={handleVerifyMember}
                                                                disabled={isVerifyingMember || !field.value}
                                                            >
                                                                {isVerifyingMember ? <Loader2 className="h-4 w-4 animate-spin" /> : memberVerified ? "Terverifikasi" : "Verifikasi"}
                                                            </Button>
                                                        )}
                                                    </div>
                                                    {memberVerified ? (
                                                        <div className="text-sm text-green-600 flex items-center mt-1">
                                                            <UserCheck className="h-3 w-3 mr-1" />
                                                            {memberVerified.name} - {memberVerified.code}
                                                        </div>
                                                    ) : (
                                                        <FormMessage />
                                                    )}
                                                </FormItem>
                                            )} />
                                        </div>

                                        <FormField control={form.control} name="transactionDate" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Tgl Transaksi</FormLabel>
                                                <FormControl>
                                                    <Input type="date" value={field.value ? format(field.value, "yyyy-MM-dd") : ""} onChange={e => field.onChange(new Date(e.target.value))} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="dueDate" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Jatuh Tempo</FormLabel>
                                                <FormControl>
                                                    <Input type="date" value={field.value ? format(field.value, "yyyy-MM-dd") : ""} onChange={e => field.onChange(new Date(e.target.value))} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <div className="md:col-span-4">
                                            <FormField control={form.control} name="notes" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Catatan</FormLabel>
                                                    <FormControl><Textarea placeholder="Keterangan pengiriman..." {...field} className="h-20" /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                        </div>
                                    </div>

                                    <Separator />

                                    {/* Items Section */}
                                    <div>
                                        <div className="flex justify-between items-start mb-4">
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
                                                    <Button type="button" size="sm" onClick={handleNewItem}>
                                                        <CirclePlus className="mr-2 h-4 w-4" /> Tambah Item
                                                    </Button>
                                                </div>
                                                <span className="text-muted-foreground/80 text-xs ml-2 font-normal">Atau tekan Ctrl+Enter</span>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            {fields.map((field, index) => {
                                                const selectedItemId = form.getValues(`items.${index}.masterItemId`);
                                                const selectedItem = itemOptions.find(i => i.id === selectedItemId);
                                                const variants = selectedItem?.masterItemVariants || [];
                                                const currentDiscounts = form.getValues(`items.${index}.discounts`) || [];

                                                return (
                                                    <div key={field.id} className="grid grid-cols-12 gap-4 items-start border p-4 rounded-lg bg-muted/10 relative">
                                                        <Button type="button" variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6 text-red-500" onClick={() => remove(index)}>
                                                            <X className="h-4 w-4" />
                                                        </Button>

                                                        {/* Item Selection */}
                                                        <div className="col-span-4">
                                                            <FormField control={form.control} name={`items.${index}.masterItemId`} render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel className="text-xs">Barang</FormLabel>
                                                                    <Combobox
                                                                        inputId={`item-select-${index}`}
                                                                        value={field.value}
                                                                        onChange={(val) => handleItemSelect(index, val)}
                                                                        options={itemOptions}
                                                                        placeholder="Pilih Barang"
                                                                        inputValue={searchItem}
                                                                        onInputChange={setSearchItem}
                                                                        renderLabel={(item) => <div className="flex flex-col"><span className="font-semibold">{item.name}</span></div>}
                                                                        filterString={searchItem}
                                                                    />
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )} />
                                                        </div>

                                                        {/* Variant */}
                                                        <div className="col-span-2">
                                                            <FormField control={form.control} name={`items.${index}.masterItemVariantId`} render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel className="text-xs">Variant</FormLabel>
                                                                    <Select
                                                                        onValueChange={(val) => handleVariantSelect(index, parseInt(val))}
                                                                        value={field.value?.toString() !== "0" ? field.value?.toString() : undefined}
                                                                        disabled={!selectedItemId}
                                                                    >
                                                                        <FormControl><SelectTrigger><SelectValue placeholder="Pilih Variant" /></SelectTrigger></FormControl>
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

                                                        {/* Qty & Price */}
                                                        <div className="col-span-1">
                                                            <FormField control={form.control} name={`items.${index}.qty`} render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel className="text-xs">Qty</FormLabel>
                                                                    <FormControl>
                                                                        <Input
                                                                            type="number"
                                                                            {...field}
                                                                            id={`qty-input-${index}`}
                                                                            onKeyDown={(e) => {
                                                                                if (e.key === "Enter") {
                                                                                    e.preventDefault();
                                                                                    barcodeInputRef.current?.focus();
                                                                                }
                                                                            }}
                                                                        />
                                                                    </FormControl>
                                                                </FormItem>
                                                            )} />
                                                        </div>
                                                        <div className="col-span-3">
                                                            <FormField control={form.control} name={`items.${index}.sellPrice`} render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel className="text-xs">Harga Jual</FormLabel>
                                                                    <FormControl>
                                                                        <div className="flex items-center h-10 px-3 text-sm border rounded-md bg-muted">
                                                                            {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(Number(field.value) || 0)}
                                                                        </div>
                                                                    </FormControl>
                                                                </FormItem>
                                                            )} />
                                                        </div>

                                                        {/* Discounts */}
                                                        <div className="col-span-2">
                                                            <FormItem>
                                                                <FormLabel className="text-xs">Disc %</FormLabel>
                                                                <div className="flex flex-col gap-2">
                                                                    {currentDiscounts.map((disc, dIndex) => (
                                                                        <div key={dIndex} className="flex items-center gap-1">
                                                                            <Input
                                                                                type="number"
                                                                                className="h-7 text-xs px-2"
                                                                                value={disc.percentage}
                                                                                onChange={(e) => updateDiscount(index, dIndex, e.target.value)}
                                                                                placeholder="0"
                                                                            />
                                                                            <span className="text-xs text-muted-foreground">%</span>
                                                                            <Button
                                                                                type="button"
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                                                onClick={() => removeDiscount(index, dIndex)}
                                                                            >
                                                                                <X className="h-3 w-3" />
                                                                            </Button>
                                                                        </div>
                                                                    ))}
                                                                    <Button
                                                                        type="button"
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="h-7 text-xs"
                                                                        onClick={() => addDiscount(index)}
                                                                    >
                                                                        <Plus className="mr-1 h-3 w-3" /> Disc
                                                                    </Button>
                                                                </div>
                                                            </FormItem>
                                                        </div>

                                                        {/* Row Calculation Info */}
                                                        <div className="col-span-12 text-right text-xs text-muted-foreground">
                                                            {calculations.itemCalculations?.[index] && (
                                                                <span>
                                                                    Net: {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(calculations.itemCalculations[index].netTotal)}
                                                                    {calculations.itemCalculations[index].discountAmount > 0 &&
                                                                        <span className="text-red-500 ml-2">(Disc: {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(calculations.itemCalculations[index].discountAmount)})</span>
                                                                    }
                                                                </span>
                                                            )}
                                                        </div>

                                                    </div>
                                                );
                                            })
                                            }
                                            {
                                                form.formState.errors.items?.root && (
                                                    <p className="text-sm text-red-500">{form.formState.errors.items.root.message}</p>
                                                )
                                            }
                                        </div>

                                        {/* Create New Item Button when list empty */}
                                        {fields.length === 0 && (
                                            <div className="text-center p-8 border border-dashed rounded-lg mt-4 text-muted-foreground">
                                                Belum ada item barang yang dipilih.
                                                <br />
                                                <Button type="button" variant="link" onClick={() => append({ masterItemId: 0, masterItemVariantId: 0, qty: 1, sellPrice: 0, discounts: [] })}>
                                                    + Tambah Item Pertama
                                                </Button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Footer / Totals */}
                                    <div className="border-t p-6 bg-muted/20">
                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                                            <div className="w-full md:w-1/3 space-y-2">
                                                {/* Empty left column */}
                                            </div>
                                            <div className="w-full md:w-1/3 space-y-2 text-right">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-muted-foreground">Subtotal Kotor:</span>
                                                    <span>{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(calculations.subTotal)}</span>
                                                </div>
                                                <div className="flex justify-between text-sm text-red-600">
                                                    <span>Total Diskon:</span>
                                                    <span>- {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(calculations.discountTotal)}</span>
                                                </div>

                                                {/* Tax */}
                                                <div className="flex justify-between items-center text-sm py-1">
                                                    <div className="flex items-center gap-2 justify-start w-full">
                                                        <span className="text-muted-foreground">Pajak (%):</span>
                                                        <FormField
                                                            control={form.control}
                                                            name="taxPercentage"
                                                            render={({ field }) => (
                                                                <Input
                                                                    type="number"
                                                                    className="w-16 h-7 text-right"
                                                                    {...field}
                                                                    placeholder="0"
                                                                />
                                                            )}
                                                        />
                                                    </div>
                                                    <span className="ml-4 min-w-[100px]">{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(calculations.taxAmount)}</span>
                                                </div>

                                                <div className="flex justify-between font-bold text-lg pt-2 border-t mt-2">
                                                    <span>Grand Total:</span>
                                                    <span>{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(calculations.grandTotal)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-2 pt-4 border-t">
                                        <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Batal</Button>
                                        <Button type="submit" disabled={isCreating || isUpdating}>
                                            {(isCreating || isUpdating) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            {editingId ? "Simpan Perubahan" : "Simpan Penjualan"}
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deletingId} onOpenChange={(o) => !o && setDeletingId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Batalkan Transaksi?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tindakan ini akan menghapus transaksi penjualan. Stok yang sudah dikurangi akan dikembalikan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDeletingId(null)}>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
                            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Hapus
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div >
    );
}
