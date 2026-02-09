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
    Check,
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DataTableColumnHeader } from "@/components/ui/data-table/data-table-column-header";
import { Separator } from "@/components/ui/separator";

import {
    useSalesList,
    useSales,
    useCreateSales,
    useUpdateSales,
    useDeleteSales,
} from "@/hooks/transaction/use-sales";
import { useItems } from "@/hooks/master/use-item";
import { memberService } from "@/services/master/member.service";
import { useBranch } from "@/providers/branch-provider";
import { useDebounce } from "@/hooks/use-debounce";
import { useModEnter } from "@/hooks/function/use-mod-enter";

import { Sales, CreateSalesDTO } from "@/types/transaction/sales";
import { Item, ItemVariant } from "@/types/master/item";
import { Member } from "@/types/master/member";
import { DatePickerWithRange } from "@/components/custom/date-picker-with-range";
import { Combobox } from "@/components/custom/combobox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { AutocompleteInput } from "@/components/custom/autocomplete-input";
import { ActionBranchButton } from "@/components/custom/action-branch-button";
import { useAccessControl, UserAccess } from "@/hooks/use-access-control";
import { itemService } from "@/services";

// --- Types & Schemas ---

const discountSchema = z.object({
    percentage: z.coerce.number().min(0).max(100),
});

const salesItemSchema = z.object({
    masterItemId: z.coerce.number().min(1, "Item wajib"),
    masterItemVariantId: z.coerce.number().min(1, "Variant wajib"),
    qty: z.coerce.number().min(1, "Qty minimal 1"),
    salesPrice: z.coerce.number().min(0, "Harga jual minimal 0"),
    discounts: z.array(discountSchema).optional(),
});

const createSalesSchema = z.object({
    branchId: z.coerce.number().min(1, "Branch wajib"),
    memberCode: z.string().optional(),
    notes: z.string().optional(),
    items: z.array(salesItemSchema).min(1, "Minimal 1 item"),
    transactionDate: z.date().optional(), // Optional UI helper, might not be sent if API doesn't support it
    cashReceived: z.coerce.number().min(0, "Jumlah tidak boleh minus"),
    paymentType: z.enum(["CASH", "DEBIT", "QRIS"]),
});

type CreateSalesFormValues = z.infer<typeof createSalesSchema>;
type SalesItemFormValues = z.infer<typeof salesItemSchema>;


export default function SalesPage() {
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
    const [isScanning, setIsScanning] = useState(false);
    const barcodeInputRef = useRef<HTMLInputElement>(null);
    const [scannedItems, setScannedItems] = useState<Item[]>([]);

    // --- Combobox Search States ---
    const [searchItem, setSearchItem] = useState("");
    const debouncedSearchItem = useDebounce(searchItem, 200);

    // Date Filter State
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

    // --- Queries ---
    const { data: salesData, isLoading } = useSalesList({
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

    const [editingId, setEditingId] = useState<number | null>(null);
    const { data: salesDetail, isLoading: isLoadingDetail } = useSales(editingId);

    // Merge list items with detail items
    const itemOptions = useMemo(() => {
        const listItems = items?.data || [];
        const detailItems = (salesDetail?.data?.transactionSalesItems || [])?.map(pi => pi.masterItem).filter((i): i is Item => !!i) || [];

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
    }, [items?.data, salesDetail, editingId, scannedItems]);

    const { mutate: createSales, isPending: isCreating } = useCreateSales();
    const { mutate: updateSales, isPending: isUpdating } = useUpdateSales();
    const { mutate: deleteSales, isPending: isDeleting } = useDeleteSales();

    // --- Create Form ---
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [memberVerified, setMemberVerified] = useState<Member | null>(null);
    const [isVerifyingMember, setIsVerifyingMember] = useState(false);

    // Reset editingId when dialog closes
    const handleOpenChange = (open: boolean) => {
        setIsCreateOpen(open);
        if (!open) {
            setEditingId(null);
            setMemberVerified(null);
            setSearchItem("");
            form.reset({ branchId: branch?.id, items: [], memberCode: "", notes: "" });
        }
    };

    const form = useForm<CreateSalesFormValues>({
        resolver: zodResolver(createSalesSchema) as Resolver<CreateSalesFormValues>,
        defaultValues: {
            branchId: branch?.id || 0,
            notes: "",
            items: [],
            memberCode: "",
            transactionDate: new Date(),
            cashReceived: 0,
            paymentType: "CASH",
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
                        // Use recordedSellPrice if available on item (mapped from backend), else 0
                        const itemWithPrice = item
                        const sellPrice = parseFloat(itemWithPrice.masterItemVariants.find(v => v.isBaseUnit)?.sellPrice || "0") || 0;

                        append({
                            masterItemId: item.id,
                            masterItemVariantId: baseVariant.id,
                            qty: 1,
                            salesPrice: sellPrice, // Only diff from Purchase: totalPrice instead of purchasePrice
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
    const watchedItems = useWatch({ control: form.control, name: "items" }) as SalesItemFormValues[];
    const watchedMemberCode = useWatch({ control: form.control, name: "memberCode" });

    // Handle Member Verification
    const handleVerifyMember = async () => {
        const code = form.getValues("memberCode");
        if (!code) return;

        setIsVerifyingMember(true);
        try {
            const res = await memberService.getByCode(code.toUpperCase());
            if (res.data) {
                setMemberVerified(res.data);
                toast.success(`Member terverifikasi: ${res.data.name}`);
            } else {
                setMemberVerified(null);
                toast.error("Member tidak ditemukan");
            }
        } catch {
            setMemberVerified(null);
            toast.error("Gagal memverifikasi member");
        } finally {
            setIsVerifyingMember(false);
        }
    };

    // Reset verified status if code changes
    useEffect(() => {
        if (memberVerified && watchedMemberCode !== memberVerified.code) {
            setMemberVerified(null);
        }
    }, [watchedMemberCode, memberVerified]);


    // Helper to add/remove/update discounts manually
    const addDiscount = (itemIndex: number) => {
        const currentItems = form.getValues("items") as SalesItemFormValues[];
        const currentDiscounts = currentItems[itemIndex].discounts || [];
        form.setValue(`items.${itemIndex}.discounts`, [...currentDiscounts, { percentage: 0 }]);
    };

    const removeDiscount = (itemIndex: number, discountIndex: number) => {
        const currentItems = form.getValues("items") as SalesItemFormValues[];
        const currentDiscounts = currentItems[itemIndex].discounts || [];
        const newDiscounts = currentDiscounts.filter((_, i) => i !== discountIndex);
        form.setValue(`items.${itemIndex}.discounts`, newDiscounts);
    };

    const updateDiscount = (itemIndex: number, discountIndex: number, val: string) => {
        const currentItems = form.getValues("items") as SalesItemFormValues[];
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
            const price = Number(item.salesPrice) || 0;
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
            const price = Number(item.salesPrice) || 0;
            subTotal += (qty * price);
            if (itemCalculations?.[index]) {
                discountTotal += itemCalculations[index].discountAmount;
            }
        });

        const taxableAmount = subTotal - discountTotal;
        const grandTotal = taxableAmount;

        return { subTotal, discountTotal, grandTotal, itemCalculations };
    }, [watchedItems]);


    const onSubmit = (values: CreateSalesFormValues) => {
        // Prepare DTO
        const payload: CreateSalesDTO = {
            branchId: values.branchId,
            memberCode: values.memberCode || undefined, // Send undefined if empty string
            notes: values.notes,
            items: values.items.map(item => ({
                masterItemId: item.masterItemId,
                masterItemVariantId: item.masterItemVariantId,
                qty: item.qty,
                salesPrice: item.salesPrice,
                discounts: item.discounts,
            })),
            cashReceived: values.cashReceived,
            paymentType: values.paymentType,
        };

        if (editingId) {
            updateSales({ id: editingId, data: payload }, {
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
            createSales(payload, {
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

    const handleEdit = (sales: Sales) => {
        setEditingId(sales.id);
        setIsCreateOpen(true);
    };

    // Populate form when detail data arrives
    useEffect(() => {
        if (editingId && salesDetail?.data) {
            const sales = salesDetail.data;
            const currentItems = sales.transactionSalesItems || [];

            if (sales.masterMember) {
                setMemberVerified(sales.masterMember);
            }

            const formDataVal = {
                branchId: sales.branchId,
                memberCode: sales.memberCode || "", // Or from masterMember code
                notes: sales.notes || "",
                transactionDate: new Date(sales.transactionDate), // UI only
                items: currentItems.map(item => ({
                    masterItemId: item.masterItemId,
                    masterItemVariantId: item.masterItemVariantId,
                    qty: item.qty,
                    salesPrice: parseFloat(String(item.salesPrice || 0)),
                    discounts: item.transactionSalesDiscounts?.map(d => ({ percentage: parseFloat(d.percentage) })) || []
                })),
                cashReceived: parseFloat(sales.cashReceived || "0"),
                paymentType: (sales.paymentType as "CASH" | "DEBIT" | "QRIS") || "CASH",
            };
            form.reset(formDataVal);
        }
    }, [editingId, salesDetail, form]);

    // --- Item Selection Logic ---
    const handleItemSelect = (index: number, itemId: number) => {
        const item = items?.data?.find(i => i.id === itemId);
        if (item && item.masterItemVariants?.length > 0) {
            form.setValue(`items.${index}.masterItemId`, itemId);
            form.setValue(`items.${index}.masterItemVariantId`, 0); // Reset variant
            form.setValue(`items.${index}.salesPrice`, 0);
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
            form.setValue(`items.${index}.salesPrice`, parseFloat(variant.sellPrice));
        }
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
        append({ masterItemId: 0, masterItemVariantId: 0, qty: 1, salesPrice: 0, discounts: [] });
        setLastAddedIndex(fields.length);
    }

    // Delete Logic
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const handleDelete = () => {
        if (!deletingId) return;
        deleteSales(deletingId, {
            onSuccess: () => {
                setDeletingId(null);
                toast.success("Penjualan dihapus");
            },
            onError: (err) => {
                const error = err as AxiosError<{ message?: string }>;
                toast.error(error.response?.data?.message || "Gagal menghapus penjualan");
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
            cell: ({ row }: any) => {
                const date = new Date(row.original.transactionDate);
                return !isNaN(date.getTime()) ? format(date, "dd MMM yyyy", { locale: idLocale }) : "-";
            },
        },
        {
            accessorKey: "invoiceNumber",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            header: ({ column }: any) => (
                <DataTableColumnHeader column={column} title="No. Invoice" />
            ),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            cell: ({ row }: any) => <span className="font-medium">{row.original.invoiceNumber}</span>,
        },
        {
            accessorKey: "masterMember.name",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            header: ({ column }: any) => (
                <DataTableColumnHeader column={column} title="Member" />
            ),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            cell: ({ row }: any) => <span className="text-muted-foreground">{row.original.masterMember?.name || "-"}</span>,
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
        data: salesData?.data || [],
        columns,
        state: {
            pagination,
            sorting,
            columnVisibility,
        },
        pageCount: salesData?.pagination?.totalPages || -1,
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
                <h2 className="text-2xl font-bold tracking-tight">Penjualan Kasir</h2>
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
                            placeholder="Cari Invoice / Member..."
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
                                <DialogTitle>{editingId ? "Edit Penjualan" : "Buat Penjualan Baru"}</DialogTitle>
                                <DialogDescription>
                                    {editingId ? "Perbarui informasi penjualan di bawah ini." : "Input detail penjualan barang."}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    {editingId && isLoadingDetail ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="h-8 w-8 animate-spin" />
                            <span className="ml-2">Memuat data penjualan...</span>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto p-6">
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                                    <div className="flex gap-4 p-4 border rounded-lg bg-slate-50 items-center justify-between">
                                        <FormField control={form.control} name="paymentType" render={({ field }) => (
                                            <FormItem className="space-y-1">
                                                <FormLabel>Metode Pembayaran</FormLabel>
                                                <FormControl>
                                                    <RadioGroup
                                                        onValueChange={field.onChange}
                                                        defaultValue={field.value}
                                                        className="flex flex-row space-x-4"
                                                    >
                                                        <FormItem className="flex items-center space-x-2 space-y-0">
                                                            <FormControl>
                                                                <RadioGroupItem value="CASH" />
                                                            </FormControl>
                                                            <FormLabel className="font-normal cursor-pointer">
                                                                CASH
                                                            </FormLabel>
                                                        </FormItem>
                                                        <FormItem className="flex items-center space-x-2 space-y-0">
                                                            <FormControl>
                                                                <RadioGroupItem value="DEBIT" />
                                                            </FormControl>
                                                            <FormLabel className="font-normal cursor-pointer">
                                                                DEBIT
                                                            </FormLabel>
                                                        </FormItem>
                                                        <FormItem className="flex items-center space-x-2 space-y-0">
                                                            <FormControl>
                                                                <RadioGroupItem value="QRIS" />
                                                            </FormControl>
                                                            <FormLabel className="font-normal cursor-pointer">
                                                                QRIS
                                                            </FormLabel>
                                                        </FormItem>
                                                    </RadioGroup>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                    </div>

                                    {/* Header Info */}
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-4 border rounded-lg bg-slate-50">

                                        {/* Member Verification */}
                                        <div className="col-span-2">
                                            <FormField control={form.control} name="memberCode" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Member Code (Opsional)</FormLabel>
                                                    <div className="flex gap-2">
                                                        <FormControl>
                                                            <Input placeholder="MBR-..." {...field} />
                                                        </FormControl>
                                                        <Button type="button" variant="secondary" onClick={handleVerifyMember} disabled={!field.value || isVerifyingMember}>
                                                            {isVerifyingMember ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                                        </Button>
                                                    </div>
                                                    {memberVerified && <p className="text-sm text-green-600 mt-1">✓ {memberVerified.name}</p>}
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                        </div>

                                        <div className="md:col-span-4">
                                            <FormField control={form.control} name="notes" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Catatan</FormLabel>
                                                    <FormControl><Textarea placeholder="Keterangan penjualan..." {...field} className="h-20" /></FormControl>
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
                                                <span className="text-xs text-muted-foreground">atau tekan F2 untuk fokus</span>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <Button type="button" size="sm" onClick={handleNewItem}>
                                                    <CirclePlus className="mr-2 h-4 w-4" /> Tambah Item
                                                </Button>
                                                <span className="text-muted-foreground/80 text-xs ml-2 font-normal">Atau tekan Ctrl+Enter</span>
                                            </div>
                                        </div>

                                        {/* Barcode Scanner Input */}


                                        <div className="space-y-4">
                                            {fields.map((field, index) => {
                                                // Use watchedItems for reactivity
                                                const currentItem = watchedItems?.[index] || {};
                                                const selectedItemId = currentItem.masterItemId;
                                                const selectedItem = itemOptions.find(i => i.id === selectedItemId);
                                                const variants = selectedItem?.masterItemVariants || [];
                                                const currentDiscounts = currentItem.discounts || [];

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

                                                        {/* Qty */}
                                                        <div className="col-span-1">
                                                            <FormField control={form.control} name={`items.${index}.qty`} render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel className="text-xs">Qty</FormLabel>
                                                                    <FormControl>
                                                                        <Input type="number" min="1" {...field} />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )} />
                                                        </div>

                                                        {/* Price */}
                                                        <div className="col-span-2">
                                                            <FormField control={form.control} name={`items.${index}.salesPrice`} render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel className="text-xs">Harga</FormLabel>
                                                                    <FormControl>
                                                                        <div className="flex items-center h-10 px-3 text-sm border rounded-md bg-muted">
                                                                            {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(Number(field.value) || 0)}
                                                                        </div>
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )} />
                                                        </div>

                                                        {/* Discounts */}
                                                        <div className="col-span-3">
                                                            <div className="flex flex-col gap-2">
                                                                <FormLabel className="text-xs">Diskon Bertingkat (%)</FormLabel>
                                                                {currentDiscounts.map((_, dIndex) => (
                                                                    <div key={dIndex} className="flex items-center gap-1">
                                                                        <Input
                                                                            className="h-8 text-xs"
                                                                            placeholder="%"
                                                                            value={currentDiscounts[dIndex]?.percentage || 0}
                                                                            onChange={(e) => updateDiscount(index, dIndex, e.target.value)}
                                                                        />
                                                                        <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-red-500" onClick={() => removeDiscount(index, dIndex)}>
                                                                            <X className="h-3 w-3" />
                                                                        </Button>
                                                                    </div>
                                                                ))}
                                                                <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={() => addDiscount(index)}>
                                                                    <Plus className="h-3 w-3 mr-1" /> Add Disc
                                                                </Button>
                                                            </div>
                                                        </div>

                                                        {/* Subtotal Display */}
                                                        <div className="col-span-12 text-right text-xs text-muted-foreground pt-2 border-t mt-2">
                                                            Subtotal: {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(calculations.itemCalculations?.[index]?.netTotal || 0)}
                                                            {calculations.itemCalculations?.[index]?.discountAmount ? <span className="text-red-500 ml-2">(-{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(calculations.itemCalculations[index].discountAmount)})</span> : ""}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <div className="mt-8 flex justify-end">
                                            <div className="w-full md:w-1/3 space-y-2">
                                                <div className="flex justify-between text-muted-foreground">
                                                    <span>Subtotal</span>
                                                    <span>{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(calculations.subTotal)}</span>
                                                </div>
                                                <div className="flex justify-between text-red-600">
                                                    <span>Total Diskon</span>
                                                    <span>-{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(calculations.discountTotal)}</span>
                                                </div>
                                                <Separator />
                                                <div className="flex justify-between font-bold text-lg">
                                                    <span>Total</span>
                                                    <span>{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(calculations.grandTotal)}</span>
                                                </div>
                                            </div>
                                        </div>


                                        {/* Payment Section */}
                                        <div className="mt-4 flex justify-end">
                                            <div className="w-full md:w-1/3 space-y-4 border-t pt-4">
                                                <FormField control={form.control} name="cashReceived" render={({ field }) => (
                                                    <FormItem className="space-y-1">
                                                        <FormLabel>Uang Diterima (Cash)</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                placeholder="0"
                                                                {...field}
                                                                className="text-right font-bold text-lg"
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )} />

                                                <div className="flex justify-between font-bold text-lg text-blue-600 bg-blue-50 p-2 rounded">
                                                    <span>Kembalian</span>
                                                    <span>
                                                        {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(
                                                            Math.max(0, (Number(form.watch("cashReceived")) || 0) - calculations.grandTotal)
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex justify-end gap-2 mt-8">
                                            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isCreating || isUpdating}>Batal</Button>
                                            <Button type="submit" disabled={isCreating || isUpdating}>
                                                {isCreating || isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                                Simpan
                                            </Button>
                                        </div>
                                    </div>
                                </form>
                            </Form>
                        </div>
                    )}

                    <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Apakah anda yakin?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Data penjualan ini akan dihapus. Stok akan dikembalikan (bertambah).
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete} className="bg-red-600">
                                    {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Hapus"}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </DialogContent>
            </Dialog>
        </div >
    );
}
