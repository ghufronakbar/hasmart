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
    usePurchaseReturns,
    usePurchaseReturn,
    useCreatePurchaseReturn,
    useUpdatePurchaseReturn,
    useDeletePurchaseReturn,
} from "@/hooks/transaction/use-purchase-return";
import { usePurchaseByInvoice } from "@/hooks/transaction/use-purchase";
import { useSuppliers } from "@/hooks/master/use-supplier";
import { useItems } from "@/hooks/master/use-item";
import { useBranch } from "@/providers/branch-provider";
import { useDebounce } from "@/hooks/use-debounce";
import { useModEnter } from "@/hooks/function/use-mod-enter";

// --- Types & Schemas ---

const discountSchema = z.object({
    percentage: z.coerce.number().min(0).max(100),
});

const purchaseReturnItemSchema = z.object({
    masterItemId: z.coerce.number().min(1, "Item wajib"),
    masterItemVariantId: z.coerce.number().min(1, "Variant wajib"),
    qty: z.coerce.number().min(1, "Qty minimal 1"),
    purchasePrice: z.coerce.number().min(0, "Harga beli minimal 0"),
    discounts: z.array(discountSchema).optional(),
});

const createPurchaseReturnSchema = z.object({
    transactionDate: z.date(),
    dueDate: z.date(),
    masterSupplierId: z.coerce.number().min(1, "Supplier wajib"),
    branchId: z.coerce.number().min(1, "Branch wajib"),
    notes: z.string().optional(),
    taxPercentage: z.coerce.number().min(0).max(100).default(0),
    items: z.array(purchaseReturnItemSchema).min(1, "Minimal 1 item"),
    invoiceNumber: z.string("Invoice wajib diisi").min(1, "Invoice Wajib diisi"),
    originalInvoiceNumber: z.string("Invoice Original wajib diisi").min(1, "Invoice Original Wajib diisi"),
});


import { PurchaseReturn, CreatePurchaseReturnDTO } from "@/types/transaction/purchase-return";
import { Item, ItemVariant } from "@/types/master/item";
import { DatePickerWithRange } from "@/components/custom/date-picker-with-range";
import { Combobox } from "@/components/custom/combobox";
import { ActionBranchButton } from "@/components/custom/action-branch-button";
import { useAccessControl, UserAccess } from "@/hooks/use-access-control";
import { itemService } from "@/services";

type CreatePurchaseReturnFormValues = z.infer<typeof createPurchaseReturnSchema>;
type PurchaseReturnItemFormValues = z.infer<typeof purchaseReturnItemSchema>;




export default function PurchaseReturnPage() {
    useAccessControl([UserAccess.accessTransactionPurchaseReturnRead], true);
    const hasAccess = useAccessControl([UserAccess.accessTransactionPurchaseReturnWrite], false);
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

    // --- Combobox Search States ---
    const [searchItem, setSearchItem] = useState("");
    const debouncedSearchItem = useDebounce(searchItem, 200);

    const [searchSupplier, setSearchSupplier] = useState("");
    const debouncedSearchSupplier = useDebounce(searchSupplier, 200);

    // Date Filter State
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

    // --- Queries ---
    const { data: purchaseReturnData, isLoading } = usePurchaseReturns({
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        search: debouncedSearch,
        sort: sorting[0]?.desc ? "desc" : "asc",
        sortBy: sorting[0]?.id,
        dateStart: dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
        dateEnd: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
    });

    const { data: suppliers } = useSuppliers({
        limit: 20,
        search: debouncedSearchSupplier,
        sortBy: "name",
        sort: "asc"
    });
    const { data: items } = useItems({
        limit: 20,
        search: debouncedSearchItem,
        sortBy: "name",
        sort: "asc"
    });

    const [editingId, setEditingId] = useState<number | null>(null);
    const { data: purchaseReturnDetail, isLoading: isLoadingDetail } = usePurchaseReturn(editingId);

    // --- Create Form ---
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const form = useForm<CreatePurchaseReturnFormValues>({
        resolver: zodResolver(createPurchaseReturnSchema) as Resolver<CreatePurchaseReturnFormValues>,
        defaultValues: {
            transactionDate: new Date(),
            dueDate: new Date(),
            masterSupplierId: 0,
            branchId: branch?.id || 0,
            notes: "",
            taxPercentage: 0,
            items: [],
            invoiceNumber: "",
            originalInvoiceNumber: "",
        },
    });

    // Invoice Check Logic
    const [isInvoiceVerified, setIsInvoiceVerified] = useState(false);
    const [searchInvoiceQuery, setSearchInvoiceQuery] = useState("");
    const [submittedInvoiceQuery, setSubmittedInvoiceQuery] = useState("");

    // Pass empty string if editing or if we don't want to search (though searchInvoiceQuery controls it)
    // The hook has enabled: !!invoiceNumber built-in.
    const { data: purchaseInvoiceData, error: invoiceCheckError, isLoading: isCheckingInvoice } = usePurchaseByInvoice(
        !editingId ? submittedInvoiceQuery : ""
    );

    // Initial State for form
    useEffect(() => {
        if (!editingId && !isInvoiceVerified) {
            form.reset({
                branchId: branch?.id || 0,
                transactionDate: new Date(),
                dueDate: new Date(),
                items: [],
                taxPercentage: 0,
                masterSupplierId: 0,
                invoiceNumber: "",
                originalInvoiceNumber: "",
            });
        }
    }, [isInvoiceVerified, editingId, branch, form]);

    // Handle Invoice Found
    useEffect(() => {
        if (purchaseInvoiceData?.data && !editingId && submittedInvoiceQuery) {
            const invoice = purchaseInvoiceData.data;
            // Populate form
            setIsInvoiceVerified(true);
            form.setValue("originalInvoiceNumber", invoice.invoiceNumber);
            form.setValue("branchId", invoice.branchId);
            form.setValue("masterSupplierId", invoice.masterSupplierId);
            form.setValue("taxPercentage", parseFloat(String(invoice.recordedTaxPercentage ?? 0)));

            // Map items
            const newItems = invoice.items.map(item => ({
                masterItemId: item.masterItemId,
                masterItemVariantId: item.masterItemVariantId,
                qty: item.qty, // Default to bought qty, user can reduce
                purchasePrice: parseFloat(item.purchasePrice), // Use original purchase price
                discounts: item.discounts?.map(d => ({ percentage: parseFloat(d.percentage) })) || []
            }));

            form.setValue("items", newItems);
            toast.success("Invoice ditemukan");
            setSubmittedInvoiceQuery(""); // specific reset
            setSearchInvoiceQuery("");
        }
    }, [purchaseInvoiceData, editingId, form, submittedInvoiceQuery]);

    // Handle Invoice Error
    useEffect(() => {
        if (submittedInvoiceQuery && invoiceCheckError) {
            toast.error("Invoice tidak ditemukan");
            setSubmittedInvoiceQuery(""); // specific reset
            setSearchInvoiceQuery("");
        }
    }, [invoiceCheckError, submittedInvoiceQuery]);

    const handleResetVerification = () => {
        setIsInvoiceVerified(false);
        setSearchInvoiceQuery("");
        form.reset({
            branchId: branch?.id || 0,
            transactionDate: new Date(),
            dueDate: new Date(),
            items: [],
            taxPercentage: 0,
            masterSupplierId: 0,
            originalInvoiceNumber: "",
            invoiceNumber: "",
        });
    };

    // Merge list items with detail items
    const itemOptions = useMemo(() => {
        const listItems = items?.data || [];
        if (!editingId || !purchaseReturnDetail?.data) return listItems;

        const detailItems = purchaseReturnDetail.data.items?.map(pi => pi.masterItem).filter((i): i is Item => !!i) || [];

        // Use Map to deduplicate by ID
        const map = new Map();
        listItems.forEach(i => map.set(i.id, i));
        detailItems.forEach(i => {
            if (i && i.id) map.set(i.id, i);
        });

        scannedItems.forEach(i => {
            if (i && i.id) map.set(i.id, i);
        });

        return Array.from(map.values());
    }, [items?.data, purchaseReturnDetail, editingId, scannedItems]);

    // Merge detail supplier if editing (to ensure it shows up)
    const supplierOptions = useMemo(() => {
        const list = suppliers?.data || [];
        if (editingId && purchaseReturnDetail?.data?.masterSupplier) {
            const current = purchaseReturnDetail.data.masterSupplier;
            if (!list.find(s => s.id === current.id)) {
                return [current, ...list];
            }
        }
        return list;
    }, [suppliers?.data, editingId, purchaseReturnDetail]);

    const { mutate: createPurchaseReturn, isPending: isCreating } = useCreatePurchaseReturn();
    const { mutate: updatePurchaseReturn, isPending: isUpdating } = useUpdatePurchaseReturn();
    const { mutate: deletePurchaseReturn, isPending: isDeleting } = useDeletePurchaseReturn();

    // Reset editingId when dialog closes
    const handleOpenChange = (open: boolean) => {
        setIsCreateOpen(open);
        if (!open) {
            setEditingId(null);
            setIsInvoiceVerified(false);
            setSearchInvoiceQuery("");
            setSearchInvoiceQuery("");
            setSearchItem("");
            setSearchSupplier("");
            form.reset({ branchId: branch?.id, transactionDate: new Date(), dueDate: new Date(), items: [], taxPercentage: 0 });
        }
    };

    // --- Create Form ---
    // Moved up

    // Ensure branchId is set when branch context loads
    useEffect(() => {
        if (branch?.id && !editingId && !isInvoiceVerified) form.setValue("branchId", branch.id);
    }, [branch, form, editingId, isInvoiceVerified]);

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "items",
    });

    useModEnter(() => handleNewItem());

    const watchedItems = useWatch({ control: form.control, name: "items" }) as PurchaseReturnItemFormValues[];
    const watchedTaxPercentage = useWatch({ control: form.control, name: "taxPercentage" });

    // Helper to add/remove/update discounts manually
    const addDiscount = (itemIndex: number) => {
        const currentItems = form.getValues("items") as PurchaseReturnItemFormValues[];
        const currentDiscounts = currentItems[itemIndex].discounts || [];
        form.setValue(`items.${itemIndex}.discounts`, [...currentDiscounts, { percentage: 0 }]);
    };

    const removeDiscount = (itemIndex: number, discountIndex: number) => {
        const currentItems = form.getValues("items") as PurchaseReturnItemFormValues[];
        const currentDiscounts = currentItems[itemIndex].discounts || [];
        const newDiscounts = currentDiscounts.filter((_, i) => i !== discountIndex);
        form.setValue(`items.${itemIndex}.discounts`, newDiscounts);
    };

    const updateDiscount = (itemIndex: number, discountIndex: number, val: string) => {
        const currentItems = form.getValues("items") as PurchaseReturnItemFormValues[];
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

        return { subTotal, discountTotal, taxAmount: taxVal, grandTotal, itemCalculations };
    }, [watchedItems, watchedTaxPercentage]);

    const onSubmit = (values: CreatePurchaseReturnFormValues) => {
        const payload: CreatePurchaseReturnDTO = {
            ...values,
            transactionDate: values.transactionDate.toISOString(),
            dueDate: values.dueDate.toISOString(),
            taxPercentage: values.taxPercentage,
        };

        if (editingId) {
            updatePurchaseReturn({ id: editingId, data: payload }, {
                onSuccess: () => {
                    handleOpenChange(false);
                    toast.success("Retur pembelian berhasil diperbarui");
                },
                onError: (err) => {
                    const error = err as AxiosError<{ errors?: { message?: string }, message?: string }>;
                    toast.error(error.response?.data?.errors?.message || error.response?.data?.message || "Gagal memperbarui retur pembelian");
                }
            });
        } else {
            createPurchaseReturn(payload, {
                onSuccess: () => {
                    handleOpenChange(false);
                    toast.success("Retur pembelian berhasil dibuat");
                },
                onError: (err) => {
                    const error = err as AxiosError<{ errors?: { message?: string }, message?: string }>;
                    toast.error(error.response?.data?.errors?.message || error.response?.data?.message || "Gagal membuat retur pembelian");
                }
            });
        }
    };

    const handleEdit = (purchaseReturn: PurchaseReturn) => {
        setEditingId(purchaseReturn.id);
        setIsCreateOpen(true);
    };

    // Populate form when detail data arrives
    useEffect(() => {
        if (editingId && purchaseReturnDetail?.data) {
            const purchaseReturn = purchaseReturnDetail.data;
            const currentItems = purchaseReturn.items || [];

            // Calculate tax percentage as fallback only if recordedTaxPercentage is missing
            // But we prefer explicit recordedTaxPercentage
            // But we prefer explicit recordedTaxPercentage
            const taxPct = purchaseReturn.recordedTaxPercentage ?? 0;

            const formDataVal = {
                transactionDate: new Date(purchaseReturn.transactionDate),
                dueDate: purchaseReturn.dueDate ? new Date(purchaseReturn.dueDate) : new Date(),
                invoiceNumber: purchaseReturn.invoiceNumber,
                masterSupplierId: purchaseReturn.masterSupplierId,
                branchId: purchaseReturn.branchId,
                notes: purchaseReturn.notes || "",
                taxPercentage: parseFloat(Number(taxPct).toFixed(2)),
                // Populating originalInvoiceNumber from relation (optional flattened) or manually
                originalInvoiceNumber: purchaseReturn.originalInvoiceNumber || purchaseReturn.transactionPurchase?.invoiceNumber || "",
                items: currentItems.map(item => ({
                    masterItemId: item.masterItemId,
                    masterItemVariantId: item.masterItemVariantId,
                    qty: item.qty,
                    purchasePrice: parseFloat(String(item.purchasePrice || 0)),
                    discounts: item.discounts?.map(d => ({ percentage: parseFloat(d.percentage) })) || []
                }))
            };
            form.reset(formDataVal);
            setIsInvoiceVerified(true);
        }
    }, [editingId, purchaseReturnDetail, form]);


    // --- Item Selection Logic ---
    const handleItemSelect = (index: number, itemId: number) => {
        const item = items?.data?.find(i => i.id === itemId);
        if (item && item.masterItemVariants?.length > 0) {
            form.setValue(`items.${index}.masterItemId`, itemId);
            form.setValue(`items.${index}.masterItemVariantId`, 0); // Reset variant
            form.setValue(`items.${index}.purchasePrice`, 0);

            // For return, we ideally want the original purchase price. 
            // If item has recordedBuyPrice, use it as default
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
        append({ masterItemId: 0, masterItemVariantId: 0, qty: 1, purchasePrice: 0, discounts: [] });
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

                    // Add to scannedItems so it appears in Combobox options
                    setScannedItems(prev => {
                        if (prev.find(i => i.id === item.id)) return prev;
                        return [...prev, item];
                    });

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
                        // Use recordedBuyPrice if available on item (mapped from backend), else 0
                        const itemWithPrice = item as { recordedBuyPrice?: string };
                        const buyPrice = itemWithPrice.recordedBuyPrice ? parseFloat(itemWithPrice.recordedBuyPrice) : 0;

                        append({
                            masterItemId: item.id,
                            masterItemVariantId: baseVariant.id, // Use baseVariant.id
                            qty: 1,
                            purchasePrice: buyPrice,
                            discounts: [],
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

    // Delete Logic
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const handleDelete = () => {
        if (!deletingId) return;
        deletePurchaseReturn(deletingId, {
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
        data: purchaseReturnData?.data || [],
        columns,
        state: {
            pagination,
            sorting,
            columnVisibility,
        },
        pageCount: purchaseReturnData?.pagination?.totalPages || -1,
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
                <h2 className="text-2xl font-bold tracking-tight">Retur Pembelian</h2>
                {hasAccess &&
                    <ActionBranchButton onClick={() => handleOpenChange(true)}>
                        Retur Baru
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
                                <DialogTitle>{editingId ? "Edit Retur Pembelian" : "Buat Retur Pembelian Baru"}</DialogTitle>
                                <DialogDescription>
                                    {editingId ? "Perbarui informasi retur pembelian di bawah ini." : "Input detail retur barang ke supplier."}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    {editingId && isLoadingDetail ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="h-8 w-8 animate-spin" />
                            <span className="ml-2">Memuat data transaksi...</span>
                        </div>
                    ) : !isInvoiceVerified && !editingId ? (
                        <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center gap-6">
                            <div className="text-center space-y-2">
                                <h3 className="text-xl font-semibold">Cek Invoice Pembelian Asal</h3>
                                <p className="text-muted-foreground text-sm">Masukkan nomor invoice pembelian yang ingin diretur.</p>
                            </div>
                            <div className="w-full max-w-sm space-y-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Contoh: PURCHASE-..."
                                        value={searchInvoiceQuery}
                                        onChange={(e) => setSearchInvoiceQuery(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                setSubmittedInvoiceQuery(searchInvoiceQuery);
                                            }
                                        }}
                                        className="pl-10 h-12 text-lg"
                                        autoFocus
                                    />
                                </div>
                                {isCheckingInvoice && <div className="text-center text-sm text-muted-foreground flex items-center justify-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Mengecek...</div>}

                                <div className="flex justify-center gap-4">
                                    <Button variant="outline" type="button" onClick={() => setIsCreateOpen(false)}>Batal</Button>
                                    <Button disabled={!searchInvoiceQuery || isCheckingInvoice} onClick={() => {
                                        setSubmittedInvoiceQuery(searchInvoiceQuery);
                                    }}>Cek Invoice</Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto p-6">
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                                    {/* Header Info */}
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-4 border rounded-lg bg-slate-50 items-start">
                                        <div className="flex flex-col gap-4">
                                            <FormField control={form.control} name="originalInvoiceNumber" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Invoice Original</FormLabel>
                                                    <FormControl>
                                                        <div className="flex gap-2">
                                                            <Input placeholder="PURCHASE-XXX" {...field} readOnly className="bg-muted" />
                                                            {!editingId && (
                                                                <Button type="button" variant="outline" size="icon" onClick={handleResetVerification} title="Ganti Invoice">
                                                                    <X className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <FormField control={form.control} name="invoiceNumber" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>No. Invoice Retur</FormLabel>
                                                    <FormControl><Input placeholder="RET-XXX" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                        </div>

                                        <FormField control={form.control} name="masterSupplierId" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Supplier</FormLabel>
                                                <Combobox
                                                    value={field.value}
                                                    onChange={(val) => form.setValue("masterSupplierId", val)}
                                                    options={supplierOptions}
                                                    placeholder="Pilih Supplier"
                                                    inputValue={searchSupplier}
                                                    onInputChange={setSearchSupplier}
                                                    renderLabel={(item) => <div className="flex flex-col"><span className="font-semibold">{item.code} ({item.name})</span><span className="text-[10px] text-muted-foreground">{(item as unknown as { masterItemCategory?: { name: string } }).masterItemCategory?.name}</span></div>}
                                                    disabled // Readonly because tied to invoice
                                                />
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
                                                    <FormControl><Textarea placeholder="Alasan retur..." {...field} className="h-20" /></FormControl>
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
                                                <Button type="button" size="sm" onClick={handleNewItem} variant="outline">
                                                    <CirclePlus className="mr-2 h-4 w-4" /> Tambah Item
                                                </Button>
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
                                                                    <FormControl><Input type="number" {...field} /></FormControl>
                                                                </FormItem>
                                                            )} />
                                                        </div>
                                                        <div className="col-span-3">
                                                            <FormField control={form.control} name={`items.${index}.purchasePrice`} render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel className="text-xs">Harga Referensi</FormLabel>
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
                                                <Button type="submit" className="w-full mt-4" disabled={isCreating || isUpdating}>
                                                    {(isCreating || isUpdating) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                    {editingId ? "Simpan Perubahan" : "Simpan Retur"}
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
                            Tindakan ini akan menghapus transaksi retur. Stok yang sudah dikurangi akan dikembalikan.
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
