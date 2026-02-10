"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
    Loader2,
    Plus,
    Pencil,
    Trash2,
    ChevronLeft,
    ChevronRight,
    CirclePlus,
    X,
    ArrowUpDown,
} from "lucide-react";
import { toast } from "sonner";
import { PaginationState, SortingState } from "@tanstack/react-table";

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
    AlertDialogFooter,
    AlertDialogHeader,
} from "@/components/ui/alert-dialog";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

import { Item, UpdateItemDTO } from "@/types/master/item";
import {
    useItems,
    useCreateItem,
    useUpdateItem,
    useDeleteItem,
} from "@/hooks/master/use-item";
import { useSuppliers } from "@/hooks/master/use-supplier";
import { useItemCategories } from "@/hooks/master/use-item-category";
import { useUnits } from "@/hooks/master/use-unit";
import { useDebounce } from "@/hooks/use-debounce";

import { AutocompleteInput } from "@/components/custom/autocomplete-input";
import { AxiosError } from "axios";
import { useAccessControl, UserAccess } from "@/hooks/use-access-control";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useItemBulkUpdateVariantPrice } from "@/hooks/master/use-item";
import { cn } from "@/lib/utils";

// --- Validation Schemas ---

const variantSchema = z.object({
    id: z.number().optional(), // For edit
    unit: z.string().optional(),
    amount: z.coerce.number().optional(),
    buyPrice: z.coerce.number().optional(), // hanya untuk display
    profitPercentage: z.coerce.number().optional(), // TODO: sementara display
    sellPrice: z.coerce.number().optional(),
    isBaseUnit: z.boolean().default(false),
    action: z.enum(["create", "update", "delete"]).default("create"),
});

const createItemSchema = z.object({
    name: z.string().min(1, "Nama item wajib"),
    code: z.string().min(1, "Kode item wajib"),
    masterSupplierCode: z.string().min(1, "Supplier wajib"),
    masterItemCategoryCode: z.string().min(1, "Kategori wajib"),
    isActive: z.boolean().default(true),
    buyPrice: z.coerce.number().optional(),
    masterItemVariants: z.array(variantSchema)
        .min(1, "Minimal 1 variant wajib")
        .refine((variants) => {
            // Filter valid variants first (must have unit and amount)
            const validVariants = variants.filter(v => v.unit && v.amount);
            const baseUnits = validVariants.filter(v => v.amount === 1);
            return baseUnits.length <= 1;
        }, "Hanya boleh ada satu variant dengan konversi 1 (Base Unit).")
        .refine((variants) => {
            // Filter valid variants first
            const validVariants = variants.filter(v => v.unit && v.amount);
            return validVariants.length > 0;
        }, "Minimal harus ada satu variant valid"),
});



type CreateItemFormValues = z.infer<typeof createItemSchema>;




export default function ItemsPage() {
    useAccessControl([UserAccess.accessMasterItemRead], true);
    const hasAccess = useAccessControl([UserAccess.accessMasterItemWrite], false);
    const hasReadBuyPrice = useAccessControl([UserAccess.accessShowBuyPrice], false);
    // --- State ---
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: 10,
    });
    const [sorting, setSorting] = useState<SortingState>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearch = useDebounce(searchTerm, 500);

    // --- Autocomplete States ---
    const [searchSupplier, setSearchSupplier] = useState("");
    const debouncedSearchSupplier = useDebounce(searchSupplier, 300);

    const [searchCategory, setSearchCategory] = useState("");
    const debouncedSearchCategory = useDebounce(searchCategory, 300);

    const [searchUnit, setSearchUnit] = useState("");
    // Unit search is client-side filtered, no debounce needed

    // --- Hooks ---
    const { data: itemData, isLoading: isItemLoading } = useItems({
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        search: debouncedSearch,
        sort: sorting[0]?.desc ? "desc" : "asc",
        sortBy: sorting[0]?.id,
    });

    // Server-side search for Supplier & Category
    const { data: suppliers } = useSuppliers({
        limit: 20,
        sortBy: "code",
        sort: "asc",
        search: debouncedSearchSupplier
    });

    const { data: categories } = useItemCategories({
        limit: 20,
        sortBy: "code",
        sort: "asc",
        search: debouncedSearchCategory
    });

    // Client-side filtering for Units (always fetch 100)
    const { data: unitsData } = useUnits({ limit: 100, sortBy: "unit", sort: "asc" });

    // Filter and Sort UnitsClient-side
    // Logic: Exact matches first, then starts with, then includes
    const filteredUnits = (unitsData?.data || []).filter(u =>
        u.unit.toLowerCase().includes(searchUnit.toLowerCase())
    ).sort((a, b) => {
        const query = searchUnit.toLowerCase();
        const aUnit = a.unit.toLowerCase();
        const bUnit = b.unit.toLowerCase();

        // Exact match priority
        if (aUnit === query && bUnit !== query) return -1;
        if (bUnit === query && aUnit !== query) return 1;

        // Starts with priority
        if (aUnit.startsWith(query) && !bUnit.startsWith(query)) return -1;
        if (bUnit.startsWith(query) && !aUnit.startsWith(query)) return 1;

        return 0;
    });

    const units = { ...unitsData, data: filteredUnits };

    const { mutate: createItem, isPending: isCreating } = useCreateItem();
    const { mutate: updateItem, isPending: isUpdating } = useUpdateItem();
    const { mutate: deleteItem } = useDeleteItem();

    // --- Dialog States ---
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
    const [editingItem, setEditingItem] = useState<Item | null>(null);

    // Variant tracking for edit mode
    // removed: variantsToDelete (now handled via action='delete')
    // removed: originalVariants (no longer needed for diffing, we just trust the form state action)

    const [deletingItem, setDeletingItem] = useState<Item | null>(null);

    // --- Bulk Update State ---
    const [isBulkMode, setIsBulkMode] = useState(false);
    const [selectedVariantIds, setSelectedVariantIds] = useState<number[]>([]);
    const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
    const [bulkNewPrice, setBulkNewPrice] = useState<number>(0);

    const { mutate: bulkUpdate, isPending: isBulkUpdating } = useItemBulkUpdateVariantPrice();

    const handleBulkUpdateToggle = () => {
        setIsBulkMode(!isBulkMode);
        setSelectedVariantIds([]); // Reset selection on toggle
    };

    const handleVariantSelection = (variantId: number, checked: boolean) => {
        if (checked) {
            setSelectedVariantIds(prev => [...prev, variantId]);
        } else {
            setSelectedVariantIds(prev => prev.filter(id => id !== variantId));
        }
    };

    const handleBulkUpdateSubmit = () => {
        if (selectedVariantIds.length === 0) return;

        bulkUpdate({
            masterItemVariants: selectedVariantIds,
            sellPrice: bulkNewPrice
        }, {
            onSuccess: () => {
                toast.success("Harga jual berhasil diperbarui");
                setIsBulkDialogOpen(false);
                setIsBulkMode(false);
                setSelectedVariantIds([]);
                setBulkNewPrice(0);
            },
            onError: (err) => {
                toast.error(err instanceof AxiosError ? err?.response?.data?.message || "Gagal update harga" : "Gagal update harga");
            }
        });
    };

    // --- Unified Form ---
    const unifiedForm = useForm<CreateItemFormValues>({
        resolver: zodResolver(createItemSchema) as any,
        defaultValues: {
            name: "",
            code: "",
            masterSupplierCode: "",
            masterItemCategoryCode: "",
            isActive: true,
            masterItemVariants: [{
                unit: "",
                amount: 1,
                sellPrice: 0,
                isBaseUnit: true
            },
            {
                unit: "",
                amount: 12,
                sellPrice: 0,
                isBaseUnit: false,
            }
            ],
        },
    });

    const { fields: variantFields, append, remove } = useFieldArray({
        control: unifiedForm.control,
        name: "masterItemVariants",
    });





    // Effect to auto-set isBaseUnit based on amount = 1 AND calculate prices
    useEffect(() => {
        const subscription = unifiedForm.watch((value, { name }) => {
            // Price Calculation Logic
            // 1. Variant specific change (profit, amount, OR sellPrice)
            const matchVariant = name?.match(/masterItemVariants\.(\d+)\.(profitPercentage|amount|sellPrice)/);
            if (matchVariant) {
                const index = parseInt(matchVariant[1]);
                const fieldChanged = matchVariant[2]; // 'profitPercentage', 'amount', or 'sellPrice'

                // Get current values
                const itemBuyPrice = unifiedForm.getValues('buyPrice') || 0;
                const variant = unifiedForm.getValues(`masterItemVariants.${index}`);

                if (variant) {
                    const amount = parseFloat(variant.amount?.toString() || "0");
                    const variantBuyPrice = itemBuyPrice * amount;

                    // Always update displayed Buy Price for the variant because amount/itemBuyPrice might have changed
                    // (We can do this safely as it's a calculated display field)
                    // Note: setValue usually triggers watch. We need to be careful.
                    // But 'buyPrice' field in variant is not watched by this regex (it watches profit/amount/sellPrice).
                    // So setting buyPrice is safe from this specific loop.
                    if (fieldChanged !== 'sellPrice') {
                        // Wait, we need to be careful not to overwrite user input if they are typing?
                        // Actually variant.buyPrice is disabled in UI (line 960), so it's purely calculated.
                        unifiedForm.setValue(`masterItemVariants.${index}.buyPrice`, parseFloat(variantBuyPrice.toFixed(2)));
                    }

                    if (fieldChanged === 'sellPrice') {
                        // Case A: User changed Sell Price -> Recalculate Profit %
                        const currentSellPrice = parseFloat(variant.sellPrice?.toString() || "0");

                        if (variantBuyPrice > 0) {
                            const profitAmount = currentSellPrice - variantBuyPrice;
                            const newProfitPct = (profitAmount / variantBuyPrice) * 100;

                            // Update Profit % ONLY if diff is significant (avoid loop)
                            const currentProfitPct = parseFloat(variant.profitPercentage?.toString() || "0");
                            if (Math.abs(newProfitPct - currentProfitPct) > 0.01) {
                                unifiedForm.setValue(`masterItemVariants.${index}.profitPercentage`, parseFloat(newProfitPct.toFixed(2)));
                            }
                        }
                    } else {
                        // Case B: User changed Profit% or Amount -> Recalculate Sell Price
                        const profitPct = parseFloat(variant.profitPercentage?.toString() || "0");

                        // Calculate Sell Price = Variant Buy Price + (Profit)
                        const newSellPrice = variantBuyPrice + (variantBuyPrice * profitPct / 100);

                        // Update Sell Price ONLY if diff is significant
                        const currentSellPrice = parseFloat(variant.sellPrice?.toString() || "0");
                        if (Math.abs(newSellPrice - currentSellPrice) > 10) { // Tolerance Rp 10? Or 0.01? 
                            // Using 0.01 for precision
                            if (Math.abs(newSellPrice - currentSellPrice) > 0.01) {
                                unifiedForm.setValue(`masterItemVariants.${index}.sellPrice`, parseFloat(newSellPrice.toFixed(2)));
                            }
                        }

                        // Also ensure buyPrice is updated if amount changed
                        unifiedForm.setValue(`masterItemVariants.${index}.buyPrice`, parseFloat(variantBuyPrice.toFixed(2)));
                    }
                }
            }

            // 2. Main Item Buy Price Change -> Update ALL variants
            if (name === 'buyPrice') {
                const itemBuyPrice = parseFloat(value.buyPrice?.toString() || "0");
                const currentVariants = unifiedForm.getValues('masterItemVariants');

                currentVariants.forEach((variant, index) => {
                    // Check if not deleted? Actually we should update all even if soft deleted, just in case restored.
                    const amount = parseFloat(variant.amount?.toString() || "0");
                    const profitPct = parseFloat(variant.profitPercentage?.toString() || "0");

                    // Recalculate based on new Item Buy Price
                    const variantBuyPrice = itemBuyPrice * amount;
                    const sellPrice = variantBuyPrice + (variantBuyPrice * profitPct / 100);

                    unifiedForm.setValue(`masterItemVariants.${index}.buyPrice`, parseFloat(variantBuyPrice.toFixed(2)));
                    unifiedForm.setValue(`masterItemVariants.${index}.sellPrice`, parseFloat(sellPrice.toFixed(2)));
                });
            }
        });
        return () => subscription.unsubscribe();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [unifiedForm.watch]);

    // --- Handlers ---

    // Open form for creating
    const handleOpenCreate = () => {
        setFormMode('create');
        setEditingItem(null);
        setEditingItem(null);
        // setVariantsToDelete([]);
        // setOriginalVariants([]);
        unifiedForm.reset({
            name: "",
            code: "",
            masterSupplierCode: "",
            masterItemCategoryCode: "",
            isActive: true,
            masterItemVariants: [{
                unit: "",
                amount: 1,
                sellPrice: 0,
                isBaseUnit: true,
                action: "create"
            },
            {
                unit: "",
                amount: 12,
                sellPrice: 0,
                isBaseUnit: false,
                action: "create"
            }],
        });
        setIsFormOpen(true);
    };

    // Open form for editing
    const handleOpenEdit = (item: Item) => {
        setFormMode('edit');
        setEditingItem(item);
        // setOriginalVariants(item.masterItemVariants || []);
        // setVariantsToDelete([]);

        unifiedForm.reset({
            name: item.name,
            code: item.code,
            masterSupplierCode: item.masterSupplier?.code || "",
            masterItemCategoryCode: item.masterItemCategory?.code || "",
            isActive: item.isActive,
            buyPrice: parseFloat(item.recordedBuyPrice),
            masterItemVariants: item.masterItemVariants?.map(v => ({
                id: v.id,
                unit: v.unit,
                amount: v.amount,
                buyPrice: parseFloat((parseFloat(item.recordedBuyPrice) * v.amount).toFixed(2)), // display
                profitPercentage: parseFloat(v.recordedProfitPercentage),
                sellPrice: parseFloat(v.sellPrice), // Parse string from API to number for form
                isBaseUnit: v.isBaseUnit,
                action: "update" // Existing variants start as 'update'
            })) || [],
        });
        setIsFormOpen(true);
    };

    // Submit handler for unified form
    const onUnifiedSubmit = async (values: CreateItemFormValues) => {
        // Filter out variants that are marked as deleted AND are new (action=create) - they shouldn't be sent at all? 
        // Logic: 
        // - id & action='delete' -> Send to backend to delete
        // - no id & action='delete' -> Should have been removed from array by UI, but if exists, ignore.
        // - action='create' / 'update' -> Send.

        const processedVariants = values.masterItemVariants
            .filter(v => {
                // Determine if valid: needs unit and amount
                const isValid = v.unit && v.amount;
                // If invalid and new (create), ignore it. 
                // If invalid and existing (update/delete), we might have an issue, but let's assume we ignore invalid new ones.
                if (!isValid && !v.id) return false;

                // If it's a new item (no id) and marked deleted, don't send it.
                if (!v.id && v.action === 'delete') return false;
                return true;
            })
            .map(v => ({
                ...v,
                // Cast to required types for backend (now that we filtered invalid ones)
                unit: v.unit!,
                amount: v.amount || 0,
                sellPrice: v.sellPrice || 0,
                isBaseUnit: v.amount === 1,
                // Ensure action is set. 
                // For legacy safety: if there's an ID, default action is update. If no ID, create.
                action: v.action || (v.id ? 'update' : 'create')
            }));

        const hasBaseUnit = processedVariants.some(v => v.amount === 1 && v.action !== 'delete');
        if (!hasBaseUnit) {
            toast.error("Minimal harus ada satu Base Unit (Konversi 1) yang aktif.");
            return;
        }

        if (formMode === 'create') {
            // Create mode - strip any 'delete' actions just in case, though UI handles it.
            const createVariants = processedVariants.filter(v => v.action !== 'delete');

            createItem({ ...values, masterItemVariants: createVariants }, {
                onSuccess: () => {
                    setIsFormOpen(false);
                    toast.success("Item berhasil dibuat");
                },
                onError: (err) => {
                    toast.error(err instanceof AxiosError ? err?.response?.data?.errors?.message : "Gagal membuat item");
                }
            });
        } else {
            // Edit mode - Send ALL variants including deleted ones
            if (!editingItem) return;

            const itemData: UpdateItemDTO = { // UpdateItemDTO extended
                name: values.name,
                code: values.code,
                masterSupplierCode: values.masterSupplierCode,
                masterItemCategoryCode: values.masterItemCategoryCode,
                isActive: values.isActive,
                masterItemVariants: processedVariants,
                buyPrice: values.buyPrice
            };

            updateItem({ id: editingItem.id, data: itemData }, {
                onSuccess: () => {
                    setIsFormOpen(false);
                    toast.success("Item berhasil diperbarui");
                },
                onError: (err) => {
                    toast.error(err instanceof AxiosError ? err?.response?.data?.errors?.message : "Gagal memperbarui item");
                }
            });
        }
    };

    // Add variant to form
    const handleVariantAdd = () => {
        append({
            unit: "",
            amount: 1,
            buyPrice: 0,
            profitPercentage: 0,
            sellPrice: 0,
            isBaseUnit: false,
            action: "create"
        });
    };

    // Delete variant from form
    const handleVariantDelete = (index: number) => {
        // Read current form state directly to ensure we have the latest action
        const currentVariant = unifiedForm.getValues(`masterItemVariants.${index}`);

        if (currentVariant.id) {
            // Existing variant - Toggle Soft Delete
            const currentAction = currentVariant.action;

            if (currentAction === 'delete') {
                // Restore
                unifiedForm.setValue(`masterItemVariants.${index}.action`, 'update');
            } else {
                // Soft Delete
                unifiedForm.setValue(`masterItemVariants.${index}.action`, 'delete');
            }
        } else {
            // New variant - Remove immediately
            remove(index);
        }
    };

    const handleDeleteItem = () => {
        if (!deletingItem) return;
        deleteItem(deletingItem.id, {
            onSuccess: () => {
                setDeletingItem(null);
                toast.success("Item berhasil dihapus");
            },
            onError: (err) => toast.error(err instanceof AxiosError ? err?.response?.data?.errors?.message : "Gagal menghapus item")
        });
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">Manajemen Item</h2>
                <div className="flex gap-2">
                    {hasAccess && (
                        <Button variant={isBulkMode ? "secondary" : "outline"} onClick={handleBulkUpdateToggle}>
                            <Pencil className="mr-2 h-4 w-4" />
                            {isBulkMode ? "Batal Edit Massal" : "Edit Harga Jual Massal"}
                        </Button>
                    )}
                    {hasAccess &&
                        <Button onClick={handleOpenCreate}>
                            <Plus className="mr-2 h-4 w-4" /> Tambah Item
                        </Button>
                    }
                </div>
            </div>

            {/* Filter */}
            <div className="flex items-center justify-between">
                <div className="flex flex-1 items-center space-x-2">
                    <Input
                        placeholder="Cari item..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-8 w-[150px] lg:w-[250px]"
                    />
                    {searchTerm && (
                        <Button
                            variant="ghost"
                            onClick={() => setSearchTerm("")}
                            className="h-8 px-2 lg:px-3"
                        >
                            Reset
                            <X className="ml-2 h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Custom Table with Rowspan */}
            <div className="rounded-md border mb-16 lg:mb-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">
                                <Button
                                    variant="ghost"
                                    onClick={() => setSorting(prev => {
                                        const isDesc = prev[0]?.id === "code" && !prev[0]?.desc;
                                        return [{ id: "code", desc: isDesc }];
                                    })}
                                    className="-ml-4"
                                >
                                    Kode
                                    <ArrowUpDown className="ml-2 h-4 w-4" />
                                </Button>
                            </TableHead>
                            <TableHead>
                                <Button
                                    variant="ghost"
                                    onClick={() => setSorting(prev => {
                                        const isDesc = prev[0]?.id === "name" && !prev[0]?.desc;
                                        return [{ id: "name", desc: isDesc }];
                                    })}
                                    className="-ml-4"
                                >
                                    Nama Item
                                    <ArrowUpDown className="ml-2 h-4 w-4" />
                                </Button>
                            </TableHead>
                            <TableHead>
                                <Button
                                    variant="ghost"
                                    onClick={() => setSorting(prev => {
                                        const isDesc = prev[0]?.id === "category" && !prev[0]?.desc;
                                        return [{ id: "category", desc: isDesc }];
                                    })}
                                    className="-ml-4"
                                >
                                    Kategori
                                    <ArrowUpDown className="ml-2 h-4 w-4" />
                                </Button>
                            </TableHead>
                            <TableHead>
                                <Button
                                    variant="ghost"
                                    onClick={() => setSorting(prev => {
                                        const isDesc = prev[0]?.id === "supplier" && !prev[0]?.desc;
                                        return [{ id: "supplier", desc: isDesc }];
                                    })}
                                    className="-ml-4"
                                >
                                    Supplier
                                    <ArrowUpDown className="ml-2 h-4 w-4" />
                                </Button>
                            </TableHead>
                            <TableHead>Stok</TableHead>
                            <TableHead>Variant</TableHead>
                            <TableHead>Unit</TableHead>
                            <TableHead>Konversi</TableHead>
                            {hasReadBuyPrice &&
                                <>
                                    <TableHead>Harga Beli</TableHead>
                                    <TableHead>Estimasi Keuntungan</TableHead>
                                </>
                            }
                            <TableHead>Harga Jual</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isItemLoading ? (
                            <TableRow>
                                <TableCell colSpan={10} className="h-24 text-center">
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin inline" /> Loading...
                                </TableCell>
                            </TableRow>
                        ) : itemData?.data?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={10} className="h-24 text-center">
                                    Tidak ada data.
                                </TableCell>
                            </TableRow>
                        ) : (
                            itemData?.data?.map((item) => {
                                const variants = item.masterItemVariants || [];
                                const rowSpan = variants.length || 1;

                                return variants.map((variant, index) => (
                                    <TableRow key={variant.id} className={selectedVariantIds.includes(variant.id) ? "bg-muted/50" : ""}>
                                        {index === 0 && (
                                            <>
                                                <TableCell rowSpan={rowSpan} className="align-top font-medium border-r">
                                                    {item.code}
                                                </TableCell>
                                                <TableCell rowSpan={rowSpan} className="align-top border-r">
                                                    <div className="font-semibold">{item.name}</div>
                                                    <Badge variant={item.isActive ? "default" : "secondary"}>
                                                        {item.isActive ? "Aktif" : "Nonaktif"}
                                                    </Badge>
                                                    {item.masterItemCategory?.name ? (
                                                        <Badge variant="outline">
                                                            {item.masterItemCategory.name}
                                                        </Badge>
                                                    ) : "-"}
                                                    {item.masterSupplier?.code ? (
                                                        <Badge variant="outline">
                                                            {item.masterSupplier?.code ? `${item.masterSupplier.code} (${item.masterSupplier?.name})` : "-"}
                                                        </Badge>
                                                    ) : "-"}
                                                </TableCell>
                                                <TableCell rowSpan={rowSpan} className="align-top font-medium border-r">
                                                    {item.masterItemCategory?.name}
                                                </TableCell>
                                                <TableCell rowSpan={rowSpan} className="align-top font-medium border-r">
                                                    {item.masterSupplier?.name}
                                                </TableCell>

                                                <TableCell rowSpan={rowSpan} className="align-top border-r">
                                                    {item.stock}
                                                </TableCell>
                                            </>
                                        )}
                                        <TableCell>
                                            <span className="font-mono text-xs">{variant.unit}</span>
                                            {variant.isBaseUnit && <Badge variant="secondary" className="ml-2 text-[10px]">Base</Badge>}
                                        </TableCell>
                                        <TableCell>{variant.unit}</TableCell>
                                        <TableCell>{variant.amount}</TableCell>
                                        {hasReadBuyPrice &&
                                            <>
                                                <TableCell>
                                                    {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(parseFloat(item.recordedBuyPrice) * variant.amount)}
                                                </TableCell>
                                                <TableCell>
                                                    {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(parseFloat(variant.recordedProfitAmount))} ({variant.recordedProfitPercentage}%)
                                                </TableCell>
                                            </>
                                        }
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {isBulkMode && (
                                                    <Checkbox
                                                        checked={selectedVariantIds.includes(variant.id)}
                                                        onCheckedChange={(c) => handleVariantSelection(variant.id, !!c)}
                                                    />
                                                )}
                                                {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(parseFloat(variant.sellPrice))}
                                            </div>
                                        </TableCell>

                                        {index === 0 && hasAccess && (
                                            <TableCell rowSpan={rowSpan} className="align-top text-right border-l">
                                                <div className="flex flex-col gap-1 items-end">
                                                    <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(item)}>
                                                        <Pencil className="h-4 w-4 mr-1" /> Edit
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => setDeletingItem(item)}>
                                                        <Trash2 className="h-4 w-4 mr-1" /> Hapus
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ));
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-end py-4 w-full">
                <div className="flex items-center justify-between space-x-2">
                    <div className="flex items-center space-x-2">
                        <p className="text-sm text-muted-foreground">Rows per page</p>
                        <Select
                            value={`${pagination.pageSize}`}
                            onValueChange={(value) => setPagination(p => ({ ...p, pageIndex: 0, pageSize: Number(value) }))}
                        >
                            <SelectTrigger className="h-8 w-[70px]">
                                <SelectValue placeholder={pagination.pageSize} />
                            </SelectTrigger>
                            <SelectContent side="top">
                                {[10, 20, 30, 40, 50].map((pageSize) => (
                                    <SelectItem key={pageSize} value={`${pageSize}`}>
                                        {pageSize}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        Page {pagination.pageIndex + 1} of {itemData?.pagination?.totalPages || 1}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPagination(p => ({ ...p, pageIndex: p.pageIndex - 1 }))}
                        disabled={pagination.pageIndex === 0}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPagination(p => ({ ...p, pageIndex: p.pageIndex + 1 }))}
                        disabled={!itemData?.pagination?.hasNextPage}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* --- BULK ACTION FOOTER --- */}
            {isBulkMode && (
                <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t p-4 shadow-up flex items-center justify-between lg:pl-64">
                    <div className="flex items-center gap-4">
                        <span className="font-semibold">{selectedVariantIds.length} item dipilih</span>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                                setIsBulkMode(false);
                                setSelectedVariantIds([]);
                            }}
                        >
                            Batal
                        </Button>
                    </div>
                    <Button
                        onClick={() => setIsBulkDialogOpen(true)}
                        disabled={selectedVariantIds.length === 0}
                    >
                        Update Harga
                    </Button>
                </div>
            )}

            {/* --- BULK UPDATE DIALOG --- */}
            <Dialog open={isBulkDialogOpen} onOpenChange={(open) => {
                if (!open) {
                    setIsBulkDialogOpen(false);
                    setBulkNewPrice(0);
                }
            }}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Update Harga Massal</DialogTitle>
                        <DialogDescription>
                            Anda akan mengubah harga jual untuk {selectedVariantIds.length} item yang dipilih.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Harga Jual Baru</Label>
                            <Input
                                type="number"
                                placeholder="0"
                                value={bulkNewPrice}
                                onChange={(e) => setBulkNewPrice(Number(e.target.value))}
                            />
                        </div>

                        <div className="rounded-md border p-2 max-h-[200px] overflow-y-auto bg-muted/20">
                            <h4 className="text-xs font-semibold mb-2 text-muted-foreground">Item yang dipilih:</h4>
                            <ul className="text-xs space-y-1">
                                {itemData?.data?.flatMap(item =>
                                    item.masterItemVariants
                                        ?.filter(v => selectedVariantIds.includes(v.id))
                                        .map(v => (
                                            <li key={v.id} className="flex justify-between">
                                                <span>{item.name} ({v.unit})</span>
                                                <span className="text-muted-foreground">
                                                    {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(Number(v.sellPrice))} →
                                                </span>
                                            </li>
                                        ))
                                )}
                            </ul>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsBulkDialogOpen(false)}>Batal</Button>
                        <Button onClick={handleBulkUpdateSubmit} disabled={isBulkUpdating}>
                            {isBulkUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Simpan Perubahan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* --- UNIFIED DIALOG (Create & Edit) --- */}
            <Dialog open={isFormOpen} onOpenChange={(open) => {
                if (!open) {
                    setIsFormOpen(false);
                    // setVariantsToDelete([]);
                    // setOriginalVariants([]);
                }
            }}>
                <DialogContent className="max-w-6xl! max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{formMode === 'create' ? 'Tambah' : 'Edit'} Item</DialogTitle>
                        <DialogDescription>
                            {formMode === 'create'
                                ? 'Masukan detail item dan variant awal.'
                                : `Perbarui informasi item: ${editingItem?.name}`}
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...unifiedForm}>
                        <form onSubmit={
                            unifiedForm.handleSubmit(onUnifiedSubmit)
                        } className="space-y-6">
                            {/* 2-Column Layout */}
                            <div className="grid grid-cols-2 gap-6">
                                {/* LEFT COLUMN: Item Info */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-medium border-b pb-2">Informasi Item</h3>

                                    <FormField control={unifiedForm.control} name="name" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nama Item</FormLabel>
                                            <FormControl><Input placeholder="Contoh: Indomie Goreng" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />

                                    <FormField control={unifiedForm.control} name="code" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Kode Item</FormLabel>
                                            <FormControl><Input placeholder="Contoh: IND001" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />

                                    <FormField control={unifiedForm.control} name="masterItemCategoryCode" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Kategori</FormLabel>
                                            <FormControl>
                                                <AutocompleteInput
                                                    value={field.value.toUpperCase()}
                                                    onChange={field.onChange}
                                                    options={categories?.data || []}
                                                    onSearch={setSearchCategory}
                                                    placeholder="Ketik code/nama kategori..."
                                                    renderLabel={(item) => <>{item.code ? <span className="mr-2 font-mono text-xs opacity-50">{item.code}</span> : null} {item.name}</>}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />

                                    <FormField control={unifiedForm.control} name="masterSupplierCode" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Supplier</FormLabel>
                                            <FormControl>
                                                <AutocompleteInput
                                                    value={field.value.toUpperCase()}
                                                    onChange={field.onChange}
                                                    options={suppliers?.data || []}
                                                    onSearch={setSearchSupplier}
                                                    placeholder="Ketik code/nama supplier..."
                                                    renderLabel={(item) => <>{item.code ? <span className="mr-2 font-mono text-xs opacity-50">{item.code}</span> : null} {item.name}</>}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />

                                    {formMode === "edit" &&
                                        <FormField control={unifiedForm.control} name="buyPrice" render={({ field }) => (
                                            <FormItem className={hasReadBuyPrice ? "" : "hidden"}>
                                                <FormLabel>Harga Beli</FormLabel>
                                                <FormControl><Input placeholder="10000"  {...field} type="number" /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                    }

                                    {formMode === 'edit' && (
                                        <FormField control={unifiedForm.control} name="isActive" render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                                <div className="space-y-0.5">
                                                    <FormLabel>Status Aktif</FormLabel>
                                                </div>
                                                <FormControl>
                                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                </FormControl>
                                            </FormItem>
                                        )} />
                                    )}
                                </div>

                                {/* RIGHT COLUMN: Variants */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center border-b pb-2">
                                        <h3 className="text-sm font-medium">Variants ({variantFields.length})</h3>
                                    </div>

                                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                                        {variantFields.map((field, index) => {
                                            // Watch the action for this specific variant to ensure UI updates immediately
                                            // accessing field.action directly from useFieldArray is not reactive to setValue
                                            const currentVariant = unifiedForm.watch(`masterItemVariants.${index}`);
                                            const action = currentVariant?.action;

                                            return (
                                                <div key={field.id} className="relative border p-3 rounded-md bg-muted/20">
                                                    {/* New Variant Indicator */}
                                                    {action === 'create' && (
                                                        <div className="absolute top-0 left-0">
                                                            <div className="bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-br-md rounded-tl-md font-bold shadow-sm">
                                                                BARU
                                                            </div>
                                                        </div>
                                                    )}

                                                    {variantFields.length > 1 && action !== 'delete' && (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="absolute top-1 right-1 h-6 w-6 text-red-500 hover:bg-red-50"
                                                            onClick={() => handleVariantDelete(index)}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    )}

                                                    {/* Soft Delete Overlay */}
                                                    {action === 'delete' && (
                                                        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/50 backdrop-blur-[1px]">
                                                            <div className="font-bold text-red-600 border border-red-600 px-3 py-1 rounded bg-white mb-2">
                                                                AKAN DIHAPUS
                                                            </div>
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                className="mt-2 bg-white hover:bg-slate-50 border-red-200 text-red-600 hover:text-red-700 cursor-pointer pointer-events-auto"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleVariantDelete(index);
                                                                }}
                                                            >
                                                                Batal Hapus
                                                            </Button>
                                                        </div>
                                                    )}

                                                    {/* Variant Content with Soft Delete Style */}
                                                    <div className={`space-y-2 mt-2 ${action === 'delete' ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
                                                        <div className="flex flex-row gap-2">
                                                            <FormField control={unifiedForm.control} name={`masterItemVariants.${index}.unit`} render={({ field }) => (
                                                                <FormItem className="w-full">
                                                                    <FormLabel className="text-xs">Satuan</FormLabel>
                                                                    <div className="w-full">
                                                                        <AutocompleteInput
                                                                            value={(field.value || "").toUpperCase()}
                                                                            onChange={(e) => field.onChange(e.toUpperCase())}
                                                                            options={units?.data?.map(u => ({ id: u.id, name: u.unit, code: u.unit })) || []}
                                                                            onSearch={setSearchUnit}
                                                                            placeholder="Pilih/Ketik"
                                                                            className="h-9"
                                                                        />
                                                                    </div>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )} />
                                                            <FormField control={unifiedForm.control} name={`masterItemVariants.${index}.amount`} render={({ field }) => (
                                                                <FormItem className="w-full">
                                                                    <FormLabel className="text-xs">Konversi</FormLabel>
                                                                    <FormControl><Input type="number" {...field} className="w-full" /></FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )} />
                                                        </div>
                                                        <div className="flex flex-row gap-2">
                                                            {formMode === "edit" &&
                                                                <>
                                                                    <FormField control={unifiedForm.control} name={`masterItemVariants.${index}.buyPrice`} render={({ field }) => (
                                                                        <FormItem className={cn("w-full", hasReadBuyPrice ? "" : "hidden")}>
                                                                            <FormLabel className="text-xs">Harga Beli</FormLabel>
                                                                            <FormControl><Input type="number" {...field} className="w-full" disabled /></FormControl>
                                                                            <FormMessage />
                                                                        </FormItem>
                                                                    )} />
                                                                    <FormField control={unifiedForm.control} name={`masterItemVariants.${index}.profitPercentage`} render={({ field }) => (
                                                                        <FormItem className={cn("w-full", hasReadBuyPrice ? "" : "hidden")}>
                                                                            <FormLabel className="text-xs">Profit (%)</FormLabel>
                                                                            <FormControl><Input type="number" {...field} className="w-full" /></FormControl>
                                                                            <FormMessage />
                                                                        </FormItem>
                                                                    )} />
                                                                </>
                                                            }
                                                            <FormField control={unifiedForm.control} name={`masterItemVariants.${index}.sellPrice`} render={({ field }) => (
                                                                <FormItem className="w-full">
                                                                    <FormLabel className="text-xs">Harga Jual</FormLabel>
                                                                    <FormControl><Input type="number" {...field} className="w-full" /></FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )} />
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                        <Button type="button" variant="ghost" size="sm" onClick={handleVariantAdd}>
                                            <CirclePlus className="mr-1 h-4 w-4" /> Tambah
                                        </Button>
                                    </div>
                                    {unifiedForm.formState.errors.masterItemVariants?.root && (
                                        <p className="text-sm text-red-500">{unifiedForm.formState.errors.masterItemVariants.root.message}</p>
                                    )}
                                </div>
                            </div>

                            <DialogFooter>
                                <Button type="submit" disabled={isCreating || isUpdating}>
                                    {(isCreating || isUpdating) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {formMode === 'create' ? 'Simpan Item' : 'Perbarui Item'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* --- DELETE ITEM ALERT --- */}
            <AlertDialog open={!!deletingItem} onOpenChange={(o) => !o && setDeletingItem(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader><DialogTitle>Hapus Item?</DialogTitle></AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteItem} className="bg-red-600">Hapus</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
