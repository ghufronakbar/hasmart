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
} from "lucide-react";
import { toast } from "sonner";
import {
    useReactTable,
    SortingState,
    VisibilityState,
    getCoreRowModel,
    PaginationState,
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
    usePurchases,
    usePurchase,
    useCreatePurchase,
    useUpdatePurchase,
    useDeletePurchase,
} from "@/hooks/transaction/use-purchase";
import { useSuppliers } from "@/hooks/master/use-supplier";
import { useItems } from "@/hooks/master/use-item";
import { useBranch } from "@/providers/branch-provider";
import { useDebounce } from "@/hooks/use-debounce";

// --- Types & Schemas ---

const discountSchema = z.object({
    percentage: z.coerce.number().min(0).max(100),
});

const purchaseItemSchema = z.object({
    masterItemId: z.coerce.number().min(1, "Item wajib"),
    masterItemVariantId: z.coerce.number().min(1, "Variant wajib"),
    qty: z.coerce.number().min(1, "Qty minimal 1"),
    purchasePrice: z.coerce.number().min(0, "Harga beli minimal 0"),
    discounts: z.array(discountSchema).optional(),
});

const createPurchaseSchema = z.object({
    transactionDate: z.date(),
    dueDate: z.date(),
    masterSupplierCode: z.string().min(1, "Kode supplier wajib"),
    branchId: z.coerce.number().min(1, "Branch wajib"),
    notes: z.string().optional(),
    taxPercentage: z.coerce.number().min(0).max(100).default(0),
    items: z.array(purchaseItemSchema).min(1, "Minimal 1 item"),
    invoiceNumber: z.string().min(1, "No. Invoice wajib"),
});


import { Purchase, CreatePurchaseDTO } from "@/types/transaction/purchase";
import { Item, ItemVariant } from "@/types/master/item";
import { DatePickerWithRange } from "@/components/custom/date-picker-with-range";
import { Combobox } from "@/components/custom/combobox";
import { AutocompleteInput } from "@/components/custom/autocomplete-input";
import { ActionBranchButton } from "@/components/custom/action-branch-button";
import { useModEnter } from "@/hooks/function/use-mod-enter";
import { useAccessControl, UserAccess } from "@/hooks/use-access-control";
import { itemService } from "@/services";
import { useF2 } from "@/hooks/function/use-f2";

type CreatePurchaseFormValues = z.infer<typeof createPurchaseSchema>;
type PurchaseItemFormValues = z.infer<typeof purchaseItemSchema>;



export default function PurchasePage() {
    useAccessControl([UserAccess.accessTransactionPurchaseRead], true);
    const hasAccess = useAccessControl([UserAccess.accessTransactionPurchaseWrite], false);
    const { branch } = useBranch();
    const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
    const [searchTerm, setSearchTerm] = useState("");
    const [sorting, setSorting] = useState<SortingState>([{
        id: "transactionDate",
        desc: true,
    }]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const debouncedSearch = useDebounce(searchTerm, 500);
    const [isScanning, setIsScanning] = useState(false);
    const barcodeInputRef = useRef<HTMLInputElement>(null);
    const [scannedItems, setScannedItems] = useState<Item[]>([]);

    // Date Filter State
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
    const [editingId, setEditingId] = useState<number | null>(null);
    const { data: purchaseDetail, isLoading: isLoadingDetail } = usePurchase(editingId);

    // --- Queries ---
    const { data: purchaseData, isLoading } = usePurchases({
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        search: debouncedSearch,
        sort: sorting[0]?.desc ? "desc" : "asc",
        sortBy: sorting[0]?.id,
        dateStart: dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
        dateEnd: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
    });

    // --- Combobox Search States ---
    const [searchSupplier, setSearchSupplier] = useState("");
    const debouncedSearchSupplier = useDebounce(searchSupplier, 200);

    const [searchItem, setSearchItem] = useState("");
    const debouncedSearchItem = useDebounce(searchItem, 200);

    const { data: suppliers } = useSuppliers({
        limit: 20,
        search: debouncedSearchSupplier,
        sortBy: "code",
        sort: "asc"
    });

    // Merge detail supplier if editing (to ensure it shows up)
    const supplierOptions = useMemo(() => {
        const list = suppliers?.data || [];
        if (editingId && purchaseDetail?.data?.masterSupplier) {
            const current = purchaseDetail.data.masterSupplier;
            if (!list.find(s => s.id === current.id)) {
                return [current, ...list];
            }
        }
        return list;
    }, [suppliers?.data, editingId, purchaseDetail]);


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
                    // Only add if not exists, or update if new one has more variants
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



    // Merge cached items with detail items and scanned items to ensure selected items are in the options list
    const itemOptions = useMemo(() => {
        const detailItems = purchaseDetail?.data?.items?.map(pi => pi.masterItem).filter((i): i is Item => !!i) || [];

        // Use Map to deduplicate by ID, prefer items with more complete variant data
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

        // Add all sources - cachedItems contains all fetched items across search queries
        cachedItems.forEach(addOrMergeItem);
        detailItems.forEach(addOrMergeItem);
        scannedItems.forEach(addOrMergeItem);

        return Array.from(map.values());
    }, [cachedItems, purchaseDetail, scannedItems]);

    const { mutate: createPurchase, isPending: isCreating } = useCreatePurchase();
    const { mutate: updatePurchase, isPending: isUpdating } = useUpdatePurchase();
    const { mutate: deletePurchase, isPending: isDeleting } = useDeletePurchase();

    // Reset editingId when dialog closes
    const handleOpenChange = (open: boolean) => {
        setIsCreateOpen(open);
        if (!open) {
            setEditingId(null);
            form.reset({ branchId: branch?.id, transactionDate: new Date(), dueDate: new Date(), items: [], taxPercentage: 0, masterSupplierCode: "", invoiceNumber: "" });
        }
    };

    // --- Create Form ---
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const form = useForm<CreatePurchaseFormValues>({
        resolver: zodResolver(createPurchaseSchema) as Resolver<CreatePurchaseFormValues>,
        defaultValues: {
            transactionDate: new Date(),
            dueDate: new Date(),
            masterSupplierCode: "",
            branchId: branch?.id || 0,
            notes: "",
            taxPercentage: 0,
            items: [],
            invoiceNumber: "",
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

    const watchedItems = useWatch({ control: form.control, name: "items" }) as PurchaseItemFormValues[];
    const watchedTaxPercentage = useWatch({ control: form.control, name: "taxPercentage" });



    // Helper to add/remove/update discounts manually (simpler than nested field array)
    const addDiscount = (itemIndex: number) => {
        const currentItems = form.getValues("items") as PurchaseItemFormValues[];
        const currentDiscounts = currentItems[itemIndex].discounts || [];
        form.setValue(`items.${itemIndex}.discounts`, [...currentDiscounts, { percentage: 0 }]);
    };

    const removeDiscount = (itemIndex: number, discountIndex: number) => {
        const currentItems = form.getValues("items") as PurchaseItemFormValues[];
        const currentDiscounts = currentItems[itemIndex].discounts || [];
        const newDiscounts = currentDiscounts.filter((_, i) => i !== discountIndex);
        form.setValue(`items.${itemIndex}.discounts`, newDiscounts);
    };

    const updateDiscount = (itemIndex: number, discountIndex: number, val: string) => {
        const currentItems = form.getValues("items") as PurchaseItemFormValues[];
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
            const price = Number(item.purchasePrice) || 0;
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
            const price = Number(item.purchasePrice) || 0;
            subTotal += (qty * price);
            if (itemCalculations?.[index]) {
                discountTotal += itemCalculations[index].discountAmount;
            }
        });

        const taxableAmount = subTotal - discountTotal;
        const taxVal = taxableAmount * ((watchedTaxPercentage || 0) / 100);
        const grandTotal = taxableAmount + taxVal;

        // DEBUGGING Create Calculations
        console.log("DEBUG: Create Calc - subTotal:", subTotal, "discountTotal:", discountTotal, "tax:", taxVal, "grand:", grandTotal);
        return { subTotal, discountTotal, taxAmount: taxVal, grandTotal, itemCalculations };
    }, [watchedItems, watchedTaxPercentage]);



    const onSubmit = (values: CreatePurchaseFormValues) => {
        // Use taxPercentage state (which is user input) for taxAmount field
        // Backend expects percentage in taxAmount field
        // The calculated tax amount is 'taxVal' but backend strictly uses it for percentage input
        const payload: CreatePurchaseDTO = {
            ...values,
            transactionDate: values.transactionDate.toISOString(),
            dueDate: values.dueDate.toISOString(),
            taxPercentage: values.taxPercentage,
        };

        if (editingId) {
            updatePurchase({ id: editingId, data: payload }, {
                onSuccess: () => {
                    handleOpenChange(false);
                    toast.success("Pembelian berhasil diperbarui");
                },
                onError: (err) => {
                    const error = err as AxiosError<{ errors?: { message?: string }, message?: string }>;
                    toast.error(error.response?.data?.errors?.message || error.response?.data?.message || "Gagal memperbarui pembelian");
                }
            });
        } else {
            createPurchase(payload, {
                onSuccess: () => {
                    handleOpenChange(false);
                    toast.success("Pembelian berhasil dibuat");
                },
                onError: (err) => {
                    const error = err as AxiosError<{ errors?: { message?: string }, message?: string }>;
                    toast.error(error.response?.data?.errors?.message || error.response?.data?.message || "Gagal membuat pembelian");
                }
            });
        }
    };

    const handleEdit = (purchase: Purchase) => {
        setEditingId(purchase.id);
        setIsCreateOpen(true);
    };

    // Populate form when detail data arrives
    useEffect(() => {
        if (editingId && purchaseDetail?.data) {
            const purchase = purchaseDetail.data;

            // Calculate tax percentage based on amount relative to (total - tax)
            // Use safe access just in case, though detail should have items
            const currentItems = purchase.items || [];

            const itemsTotal = currentItems.reduce((acc, item) => acc + (item.qty * (parseFloat(String(item.purchasePrice)) || 0)), 0);
            const discountTotal = currentItems.reduce((acc, item) => {
                const itemTotal = item.qty * (parseFloat(String(item.purchasePrice)) || 0);
                let currentDisc = 0;
                let currentTotal = itemTotal;
                item.discounts?.forEach(d => {
                    const amount = currentTotal * (parseFloat(d.percentage) / 100);
                    currentDisc += amount;
                    currentTotal -= amount;
                });
                return acc + currentDisc;
            }, 0);

            console.log("DEBUG: purchaseDetail arrived", purchase);
            console.log("DEBUG: recordedTaxPercentage", purchase.recordedTaxPercentage);

            const taxable = itemsTotal - discountTotal;
            // Use recordedTaxPercentage directly if available
            // If not (legacy), try to calc from amount
            const taxPct = parseFloat(String(purchase.recordedTaxPercentage ?? 0)) || (taxable > 0 ? (parseFloat(purchase.recordedTaxAmount) / taxable) * 100 : 0);

            console.log("DEBUG: setting taxPercentage to", taxPct);

            const formDataVal = {
                transactionDate: new Date(purchase.transactionDate),
                dueDate: purchase.dueDate ? new Date(purchase.dueDate) : new Date(),
                invoiceNumber: purchase.invoiceNumber,
                masterSupplierCode: purchase.masterSupplier?.code || "",
                branchId: purchase.branchId,
                notes: purchase.notes || "",
                taxPercentage: parseFloat(Number(taxPct).toFixed(2)),
                // Ensure field naming matches what schema expects
                items: currentItems.map(item => ({
                    masterItemId: item.masterItemId,
                    masterItemVariantId: item.masterItemVariantId,
                    qty: item.qty,
                    purchasePrice: parseFloat(String(item.purchasePrice || 0)),
                    discounts: item.discounts?.map(d => ({ percentage: parseFloat(d.percentage) })) || []
                }))
            };
            console.log("DEBUG: form reset with", formDataVal);
            form.reset(formDataVal);
        }
    }, [editingId, purchaseDetail, form]);


    // --- Item Selection Logic ---
    const handleItemSelect = (index: number, itemId: number) => {
        const item = items?.data?.find(i => i.id === itemId);
        if (item && item.masterItemVariants?.length > 0) {
            form.setValue(`items.${index}.masterItemId`, itemId);
            form.setValue(`items.${index}.masterItemVariantId`, 0); // Reset variant
            form.setValue(`items.${index}.purchasePrice`, 0);
            const itemWithPrice = item as { recordedBuyPrice?: string };
            if (itemWithPrice.recordedBuyPrice) {
                form.setValue(`items.${index}.purchasePrice`, parseFloat(itemWithPrice.recordedBuyPrice));
            }
            form.setValue(`items.${index}.discounts`, []);
        }
    };

    const handleVariantSelect = (index: number, variantId: number) => {
        form.setValue(`items.${index}.masterItemVariantId`, variantId);
    };

    // Focus management for new items
    // Focus management for new items
    const [focusTarget, setFocusTarget] = useState<{ index: number, type: 'item' | 'qty' } | null>(null);

    // Trigger focus when target changes or fields length changes (render update)
    const [focusTrigger, setFocusTrigger] = useState(0);

    useEffect(() => {
        if (focusTarget !== null) {
            // Wait for render
            setTimeout(() => {
                if (focusTarget.type === 'item') {
                    const element = document.getElementById(`item-select-${focusTarget.index}`);
                    element?.focus();
                } else if (focusTarget.type === 'qty') {
                    const element = document.getElementById(`qty-input-${focusTarget.index}`) as HTMLInputElement;
                    if (element) {
                        element.focus();
                        element.select(); // Auto select for overwrite
                    }
                }
            }, 50);
        }
    }, [focusTarget, focusTrigger, fields.length]); // Depend on fields.length to wait for render

    const handleNewItem = () => {
        append({ masterItemId: 0, masterItemVariantId: 0, qty: 1, purchasePrice: 0, discounts: [] });
        // Set target to focus new item
        setFocusTarget({ index: fields.length, type: 'item' });
    }

    useModEnter(() => handleNewItem(), {
        enabled: true,
    });

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

                    // 1. Check for Exact Match (Same Item + Same Variant)
                    // If multiple, pick last? Or first? Let's pick last added usually implies working on it.
                    // But standard findIndex picks first. Let's stick to first for simplicity.
                    const exactMatchIndex = currentItems.findIndex(
                        line => line.masterItemId === item.id && line.masterItemVariantId === baseVariant.id
                    );

                    if (exactMatchIndex >= 0) {
                        // EXACT MATCH: + Focus
                        setFocusTarget({ index: exactMatchIndex, type: 'qty' });
                        setFocusTrigger(prev => prev + 1);
                        toast.success(`${item.name} sudah ada`);
                    } else {
                        // 2. Check for Item Match (Different Variant)
                        const itemMatchIndex = currentItems.findIndex(
                            line => line.masterItemId === item.id
                        );

                        if (itemMatchIndex >= 0) {
                            // PARTIAL MATCH: Just Focus Qty (No Increment)
                            setFocusTarget({ index: itemMatchIndex, type: 'qty' });
                            setFocusTrigger(prev => prev + 1);
                            toast.info(`${item.name} sudah ada`);
                        } else {
                            // 3. NO MATCH: Append New Item
                            // Use recordedBuyPrice if available on item (mapped from backend), else 0
                            const itemWithPrice = item as { recordedBuyPrice?: string };
                            const buyPrice = itemWithPrice.recordedBuyPrice ? parseFloat(itemWithPrice.recordedBuyPrice) : 0;

                            append({
                                masterItemId: item.id,
                                masterItemVariantId: baseVariant.id,
                                qty: 1,
                                purchasePrice: buyPrice,
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
        deletePurchase(deletingId, {
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
            accessorKey: "masterSupplier.name",
            id: "masterSupplierName",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            header: ({ column }: any) => (
                <DataTableColumnHeader column={column} title="Supplier" />
            ),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            cell: ({ row }: any) => row.original.masterSupplier?.name,
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
        data: purchaseData?.data || [],
        columns,
        state: {
            pagination,
            sorting,
            columnVisibility,
        },
        pageCount: purchaseData?.pagination?.totalPages || -1,
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
                <h2 className="text-2xl font-bold tracking-tight">Transaksi Pembelian</h2>
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
                                <DialogTitle>{editingId ? "Edit Transaksi Pembelian" : "Buat Transaksi Pembelian Baru"}</DialogTitle>
                                <DialogDescription>
                                    {editingId ? "Perbarui informasi pembelian di bawah ini." : "Input detail transaksi pembelian barang ke supplier."}
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
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-4 border rounded-lg bg-slate-50">
                                        <FormField control={form.control} name="invoiceNumber" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>No. Invoice</FormLabel>
                                                <FormControl><Input placeholder="PURCH-XXX" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="masterSupplierCode" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Supplier</FormLabel>
                                                <FormControl>
                                                    <AutocompleteInput
                                                        value={field.value}
                                                        onChange={(val) => form.setValue("masterSupplierCode", val.toUpperCase())}
                                                        options={supplierOptions}
                                                        placeholder="Ketik kode supplier..."
                                                        onSearch={setSearchSupplier}
                                                        renderLabel={(item) => (
                                                            <div className="flex flex-col">
                                                                <span className="font-semibold">{item.code}</span>
                                                                <span className="text-xs text-muted-foreground">{item.name}</span>
                                                            </div>
                                                        )}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
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
                                                    <FormControl><Textarea placeholder="Catatan tambahan..." {...field} className="h-20" /></FormControl>
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
                                                <Button type="button" size="sm" onClick={handleNewItem}>
                                                    <CirclePlus className="mr-2 h-4 w-4" /> Tambah Item
                                                </Button>
                                                <span className="text-xs text-muted-foreground">Atau tekan Ctrl+Enter</span>
                                            </div>
                                        </div>

                                        {/* Barcode Scanner Input */}


                                        <div className="space-y-4">
                                            {fields.map((field, index) => {
                                                const selectedItemId = form.getValues(`items.${index}.masterItemId`);
                                                const selectedItem = itemOptions.find(i => i.id === selectedItemId);
                                                const variants = selectedItem?.masterItemVariants || [];

                                                // Helper for discount display
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
                                                            <FormField control={form.control} name={`items.${index}.purchasePrice`} render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel className="text-xs">Harga Beli</FormLabel>
                                                                    <FormControl><Input type="number" {...field} /></FormControl>
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
                                            })}
                                            {form.formState.errors.items?.root && (
                                                <p className="text-sm text-red-500">{form.formState.errors.items.root.message}</p>
                                            )}
                                        </div>
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

                                                {/* Tax Positioned Here */}
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
                                                <Button type="submit" className="w-full mt-4" disabled={isCreating || isUpdating}>
                                                    {(isCreating || isUpdating) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                    {editingId ? "Simpan Perubahan" : "Simpan Transaksi"}
                                                </Button>
                                            </div>
                                        </div>
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
                            Tindakan ini akan menghapus transaksi dan mengembalikan stok yang telah bertambah.
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
