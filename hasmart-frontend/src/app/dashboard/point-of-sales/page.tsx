"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useForm, useFieldArray, useWatch, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
    Loader2,
    Search,
    Trash2,
    Plus,
    X,
    ShoppingCart,
    CreditCard,
    User
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
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
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { useCreateSales } from "@/hooks/transaction/use-sales";
import { useItems } from "@/hooks/master/use-item";
import { memberService } from "@/services/master/member.service";
import { useBranch } from "@/providers/branch-provider";
import { useDebounce } from "@/hooks/use-debounce";
import { ItemVariant } from "@/types/master/item";
import { Member } from "@/types/master/member";
import { Combobox } from "@/components/custom/combobox";
import { itemService } from "@/services";
import { useRouter } from "next/navigation";
import { CreateMemberDialog } from "./components/create-member-dialog";
import { useAccessControl, UserAccess } from "@/hooks/use-access-control";
import { AxiosError } from "axios";
import { useReactToPrint } from "react-to-print";
import { DailySalesReceipt } from "@/components/custom/daily-sales-receipt";
import { Receipt } from "@/components/custom/receipt";
import { CashFlowDialog } from "./components/cash-flow-dialog";
import { receiptService } from "@/services/report/receipt.service";
import { SalesReceipt, ReceiptData } from "@/types/report/receipt";
import { Copy, Printer } from "lucide-react";
import { useModEnter } from "@/hooks/function/use-mod-enter";

// --- Schema (Mirrors SalesPage but streamlined) ---
const discountSchema = z.object({
    percentage: z.coerce.number().min(0).max(100),
});

const salesItemSchema = z.object({
    masterItemId: z.coerce.number().min(1, "Item wajib"),
    masterItemVariantId: z.coerce.number().min(1, "Variant wajib"),
    qty: z.coerce.number().min(1, "Qty minimal 1"),
    salesPrice: z.coerce.number().min(0, "Harga jual minimal 0"),
    discounts: z.array(discountSchema).optional(),

    // UI Helpers (not sent to API directly, handled in transform)
    name: z.string().optional(),
    variantName: z.string().optional(),
    unit: z.string().optional(),
    amount: z.number().optional(), // Conversion amount
    variants: z.any().optional(), // Store available variants for switching
});

const createSalesSchema = z.object({
    branchId: z.coerce.number().min(1, "Branch wajib"),
    memberCode: z.string().optional(),
    notes: z.string().optional(),
    items: z.array(salesItemSchema).min(1, "Belum ada item di keranjang"),
    transactionDate: z.date(),
    cashReceived: z.coerce.number().min(0, "Jumlah tidak boleh minus"),
    paymentType: z.enum(["CASH", "DEBIT", "QRIS"]),
});

type CreateSalesFormValues = z.infer<typeof createSalesSchema>;
type SalesItemFormValues = z.infer<typeof salesItemSchema>;

export default function PointOfSalesPage() {
    const { branch, isLoading: isBranchLoading } = useBranch();
    const [searchItem, setSearchItem] = useState("");
    const debouncedSearchItem = useDebounce(searchItem, 200);
    const router = useRouter()

    useAccessControl([UserAccess.accessPointOfSalesRead], true);
    const hasAccess = useAccessControl([UserAccess.accessPointOfSalesWrite], false);

    // --- State ---
    const [memberVerified, setMemberVerified] = useState<Member | null>(null);
    const [isVerifyingMember, setIsVerifyingMember] = useState(false);
    const [isCreateMemberOpen, setIsCreateMemberOpen] = useState(false);
    const [lastAddedIndex, setLastAddedIndex] = useState<number | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const barcodeInputRef = useRef<HTMLInputElement>(null);
    const qtyInputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const [scanTrigger, setScanTrigger] = useState(0);

    // --- Daily Receipt ---
    const dailyReceiptRef = useRef<HTMLDivElement>(null);
    const [dailyReceiptData, setDailyReceiptData] = useState<SalesReceipt | null>(null);
    const [isPrintingDaily, setIsPrintingDaily] = useState(false);

    const handlePrintDaily = useReactToPrint({
        contentRef: dailyReceiptRef,
    });

    // --- Transaction Receipt ---
    const transactionReceiptRef = useRef<HTMLDivElement>(null);
    const [transactionReceiptData, setTransactionReceiptData] = useState<ReceiptData | null>(null);
    const [isPrintingTransaction, setIsPrintingTransaction] = useState(false);

    const handlePrintTransaction = useReactToPrint({
        contentRef: transactionReceiptRef,
        documentTitle: `Struk-${new Date().getTime()}`,
        onAfterPrint: () => setTransactionReceiptData(null),
    });

    // --- Cash Flow Dialog ---
    const [isCashFlowOpen, setIsCashFlowOpen] = useState(false);

    const handleFetchAndPrintDaily = async () => {
        if (!branch?.id) return;
        setIsPrintingDaily(true);
        try {
            const res = await receiptService.getDailySales({
                date: new Date(),
                branchId: branch.id,
            });
            if (res.data) {
                setDailyReceiptData(res.data);
                // Wait for state update and render
                setTimeout(() => {
                    handlePrintDaily();
                    setIsPrintingDaily(false);
                }, 500);
            } else {
                toast.error("Data tidak ditemukan");
                setIsPrintingDaily(false);
            }
        } catch (error) {
            console.error(error);
            toast.error("Gagal memuat laporan harian");
            setIsPrintingDaily(false);
        }
    };

    // --- Queries ---
    const { data: items } = useItems({
        limit: 20,
        search: debouncedSearchItem,
        sortBy: "name",
        sort: "asc",
        onlyActive: true,
    });

    const itemsList = items?.data || [];

    // Mutation
    const { mutate: createSales, isPending: isCreating } = useCreateSales();

    // --- Form ---
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

    const { fields, append, remove, update } = useFieldArray({
        control: form.control,
        name: "items",
    });

    const watchedItems = useWatch({ control: form.control, name: "items" }) as SalesItemFormValues[];
    const watchedMemberCode = useWatch({ control: form.control, name: "memberCode" });

    // Ensure branchId
    useEffect(() => {
        if (branch?.id) form.setValue("branchId", branch.id);
    }, [branch, form]);

    // Member Verification
    const handleVerifyMember = async () => {
        const code = form.getValues("memberCode");
        if (!code) return;

        setIsVerifyingMember(true);
        try {
            const res = await memberService.getByCode(code.toUpperCase());
            if (res.data) {
                setMemberVerified(res.data);
                toast.success(`Member: ${res.data.name}`);
            } else {
                setMemberVerified(null);
                toast.error("Member tidak ditemukan");
            }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_) {
            setMemberVerified(null);
            toast.error("Gagal verifikasi member");
        } finally {
            setIsVerifyingMember(false);
        }
    };

    // Reset member if code changes manually
    useEffect(() => {
        if (memberVerified && watchedMemberCode !== memberVerified.code) {
            setMemberVerified(null);
        }
    }, [watchedMemberCode, memberVerified]);

    const handleCreateMemberSuccess = (member: Member) => {
        setMemberVerified(member);
        form.setValue("memberCode", member.code);
    };

    const handleMemberKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleVerifyMember();
        }
    };

    const handleClearMember = () => {
        setMemberVerified(null);
        form.setValue("memberCode", "");
    };

    // Handle Item Selection (Add to Cart)
    const handleAddItem = (itemId: number) => {
        const item = itemsList.find(i => i.id === itemId);
        if (!item) return;

        // Check if item already exists in cart defined by same variant?
        // Since we pick Item first, then Variant. Logic:
        // 1. If item has 1 variant, auto select it.
        // 2. If item has multiple, maybe prompt or just default to first?
        // Let's mirror SalesPage: Add row, then select variant.
        // BUT for POS, speed is key.
        // Implementation: Add row with item selected. If 1 variant, select it.

        const defaultVariant = item.masterItemVariants && item.masterItemVariants.length > 0
            ? item.masterItemVariants.find(v => v.isBaseUnit) || item.masterItemVariants[0]
            : null;

        if (!defaultVariant) {
            toast.error("Item ini tidak memiliki variant!");
            return;
        }

        // Check duplicates? Usually POS aggregates qty.
        const existingIndex = watchedItems.findIndex(
            line => line.masterItemId === item.id && line.masterItemVariantId === defaultVariant.id
        );

        if (existingIndex >= 0) {
            // Increment Qty
            const existingItem = watchedItems[existingIndex];
            update(existingIndex, {
                ...existingItem,
                qty: Number(existingItem.qty) + 1,
            });
            setLastAddedIndex(existingIndex);
        } else {
            // Append new
            append({
                masterItemId: item.id,
                masterItemVariantId: defaultVariant.id,
                qty: 1,
                salesPrice: parseFloat(defaultVariant.sellPrice),
                discounts: [],
                name: item.name,
                variantName: `${defaultVariant.unit} (${defaultVariant.amount})`,
                unit: defaultVariant.unit,
                amount: defaultVariant.amount,
                variants: item.masterItemVariants // Save for UI switching
            });
            setLastAddedIndex(fields.length); // Next index
        }

        // Clear search to focus back on scanning/typing next
        setSearchItem("");
        // Trigger focus to Qty
        setScanTrigger(prev => prev + 1);
    };

    useModEnter(() => barcodeInputRef.current?.focus());

    // Auto-focus Qty input when scan finishes
    useEffect(() => {
        if (lastAddedIndex !== null) {
            // Small timeout to allow ref to populate for new items
            setTimeout(() => {
                const input = qtyInputRefs.current[lastAddedIndex];
                if (input) {
                    input.focus();
                    input.select(); // Auto-select so user can type immediately
                }
            }, 50);
        }
    }, [lastAddedIndex, scanTrigger]);

    // Handle Barcode Scan
    const handleScan = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            const code = e.currentTarget.value.trim();
            if (!code) return;

            e.currentTarget.value = ""; // Clear immediately
            setIsScanning(true);

            try {
                // Use service directly for event-based fetching
                // Now returns Item (with code at item level)
                const res = await itemService.getItemByCode(code);

                if (res.data) {
                    const item = res.data;
                    if (!item) {
                        toast.error("Item tidak ditemukan (No Data)");
                        return;
                    }

                    if (!item.isActive) {
                        toast.error("Item tidak aktif");
                        return;
                    }

                    // Get base unit variant (amount === 1) or first variant
                    const baseVariant = item.masterItemVariants.find(v => v.isBaseUnit)
                        || item.masterItemVariants[0];

                    if (!baseVariant) {
                        toast.error("Item tidak memiliki variant");
                        return;
                    }

                    // Add to cart logic
                    const existingIndex = watchedItems.findIndex(
                        line => line.masterItemId === item.id && line.masterItemVariantId === baseVariant.id
                    );

                    if (existingIndex >= 0) {
                        const existingItem = watchedItems[existingIndex];
                        update(existingIndex, {
                            ...existingItem,
                            qty: Number(existingItem.qty) + 1,
                        });
                        setLastAddedIndex(existingIndex);
                        setScanTrigger(prev => prev + 1);
                        toast.success(`${item.name} (+1)`);
                    } else {
                        append({
                            masterItemId: item.id,
                            masterItemVariantId: baseVariant.id,
                            qty: 1,
                            salesPrice: parseFloat(baseVariant.sellPrice),
                            discounts: [],
                            name: item.name,
                            variantName: `${baseVariant.unit} (${baseVariant.amount})`,
                            unit: baseVariant.unit,
                            amount: baseVariant.amount,
                            variants: item.masterItemVariants
                        });
                        setLastAddedIndex(fields.length);
                        setScanTrigger(prev => prev + 1);
                        toast.success(`${item.name} ditambahkan`);
                    }
                } else {
                    toast.error("Item tidak ditemukan");
                }
            } catch (error) {
                console.error(error);
                toast.error("Kode tidak ditemukan");
            } finally {
                setIsScanning(false);
            }
        }
    };

    // Variant Switching
    const changeVariant = (index: number, variantId: string) => {
        const item = watchedItems[index];
        const variants = item.variants as ItemVariant[];
        const newVariant = variants.find(v => v.id.toString() === variantId);

        if (newVariant) {
            update(index, {
                ...item,
                masterItemVariantId: newVariant.id,
                variantName: `${newVariant.unit} (${newVariant.amount})`,
                unit: newVariant.unit,
                amount: newVariant.amount,
                salesPrice: parseFloat(newVariant.sellPrice)
            });
        }
    };

    // Discount Helpers
    const addDiscount = (index: number) => {
        const item = form.getValues(`items.${index}`);
        const currentDiscounts = item.discounts || [];
        form.setValue(`items.${index}.discounts`, [...currentDiscounts, { percentage: 0 }]);
    };

    const removeDiscount = (index: number, discountIndex: number) => {
        const item = form.getValues(`items.${index}`);
        const currentDiscounts = item.discounts || [];
        const newDiscounts = currentDiscounts.filter((_, i) => i !== discountIndex);
        form.setValue(`items.${index}.discounts`, newDiscounts);
    };

    const updateDiscount = (index: number, discountIndex: number, val: string) => {
        const item = form.getValues(`items.${index}`);
        const currentDiscounts = item.discounts || [];
        const newDiscounts = [...currentDiscounts];
        if (val === "" || parseFloat(val) === 0) {
            // If cleared or 0, maybe remove? For now just set 0
            newDiscounts[discountIndex] = { percentage: 0 };
        } else {
            newDiscounts[discountIndex] = { percentage: parseFloat(val) };
        }
        form.setValue(`items.${index}.discounts`, newDiscounts);
    };

    // Calculations
    const calculations = useMemo(() => {
        let subTotal = 0;
        let discountTotal = 0;

        const itemCalculations = watchedItems?.map(item => {
            const qty = Number(item.qty) || 0;
            const price = Number(item.salesPrice) || 0;
            let itemTotal = qty * price;
            let currentDiscount = 0;

            if (item.discounts && item.discounts.length > 0) {
                item.discounts.forEach(d => {
                    const paramsPct = Number(d.percentage) || 0;
                    const discAmount = itemTotal * (paramsPct / 100);
                    currentDiscount += discAmount;
                    itemTotal -= discAmount;
                });
            }

            return {
                netTotal: itemTotal, // Total after discount
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

        const grandTotal = subTotal - discountTotal;

        return { subTotal, discountTotal, grandTotal, itemCalculations };
    }, [watchedItems]);

    // Submit
    const onSubmit = (values: CreateSalesFormValues, shouldPrint = false) => {
        // Validation: Verify Cash Received
        if (values.cashReceived < calculations.grandTotal) {
            toast.error("Uang diterima kurang dari total transaksi!");
            return;
        }

        // Strip UI helpers
        const payload = {
            ...values,
            items: values.items.map(i => ({
                masterItemId: i.masterItemId,
                masterItemVariantId: i.masterItemVariantId,
                qty: i.qty,
                salesPrice: i.salesPrice,
                discounts: i.discounts
            })),
            cashReceived: values.cashReceived,
            paymentType: values.paymentType,
        };

        createSales(payload, {
            onSuccess: async (data) => {
                const salesId = data?.data?.id;

                if (shouldPrint && salesId) {
                    setIsPrintingTransaction(true);
                    try {
                        const res = await receiptService.get("sales", salesId);
                        if (res.data) {
                            setTransactionReceiptData(res.data);
                            // Wait for render
                            setTimeout(() => {
                                handlePrintTransaction();
                                setIsPrintingTransaction(false);
                            }, 500);
                        }
                    } catch (error) {
                        console.error(error);
                        toast.error("Gagal memuat struk untuk dicetak");
                        setIsPrintingTransaction(false);
                    }
                }

                form.reset({
                    branchId: branch?.id || 0,
                    notes: "",
                    items: [],
                    memberCode: "",
                    transactionDate: new Date(),
                    cashReceived: 0,
                    paymentType: "CASH",
                });
                setMemberVerified(null);
                setSearchItem("");
                setIsConfirmOpen(false); // Close dialog on success
                toast.success("Transaksi Berhasil!");
            },
            onError: (error) => {
                if (error instanceof AxiosError) {
                    toast.error(error.response?.data?.errors?.message || "Terjadi kesalahan");
                } else {
                    toast.error("Terjadi kesalahan");
                }
            }
        });
    };

    if (isBranchLoading) return <div className="w-full h-full flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin" />
    </div>

    if (!branch && !isBranchLoading) {
        toast.error("Harap pilih cabang terlebih dahulu");
        router.push("/dashboard");
    }

    return (
        <div className="flex lg:flex-row flex-col h-[calc(100vh-80px)] overflow-hidden gap-4 p-2 bg-muted/20 -m-4 sm:p-4">

            {/* LEFT: Cart / Items */}
            <div className="flex-1 flex flex-col gap-4 min-w-0">
                {/* Header / Search */}
                <Card className="flex-none p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex flex-col gap-4 w-full">
                            {/* Barcode Scanner Input */}
                            <div className="relative">
                                <Input
                                    ref={barcodeInputRef}
                                    placeholder="Scan Barcode (Ctrl + Enter untuk fokus)"
                                    className="h-12 text-lg font-mono border-primary/50 focus-visible:ring-primary pl-10"
                                    onKeyDown={handleScan}
                                    autoFocus
                                    disabled={isScanning}
                                />
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                    {isScanning ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <Combobox
                                        value={0} // Always reset
                                        onChange={handleAddItem}
                                        options={itemsList.map(i => ({ id: i.id, name: i.name }))} // Simplified options
                                        placeholder="Cari Nama Barang (Manual Search)..."
                                        className="w-full h-10"
                                        inputValue={searchItem}
                                        onInputChange={setSearchItem}
                                        filterString={searchItem}
                                        renderLabel={(item) => (
                                            <div className="flex flex-col text-left">
                                                <span className="font-semibold">{item.name}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {/* Show base price or variant count? */}
                                                    Variasi: {itemsList.find(iList => iList.id === item.id)?.masterItemVariants?.length || 0}
                                                </span>
                                            </div>
                                        )}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="w-fit">
                            <Button
                                className="w-fit"
                                variant="outline"
                                onClick={handleFetchAndPrintDaily}
                                disabled={isPrintingDaily}
                            >
                                {isPrintingDaily ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Copy className="mr-2 h-4 w-4" />}
                                Cetak Laporan Hari Ini
                            </Button>
                            <Button
                                className="w-full mt-2"
                                variant="outline"
                                onClick={() => setIsCashFlowOpen(true)}
                            >
                                Arus Kas
                            </Button>
                        </div>
                    </div>
                </Card>

                <CashFlowDialog open={isCashFlowOpen} onOpenChange={setIsCashFlowOpen} />

                {/* Items List */}
                <Card className="flex-1 overflow-hidden flex flex-col">
                    <CardHeader className="h-fit border-b bg-muted/10">
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Keranjang Belanja</CardTitle>
                            <Badge variant="secondary">{watchedItems.length} Items</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto p-0">
                        {fields.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50 space-y-4">
                                <ShoppingCart className="h-16 w-16" />
                                <p className="text-lg">Keranjang Kosong</p>
                                <p className="text-sm">Scan barcode atau cari item untuk memulai.</p>
                            </div>
                        ) : (
                            <div className="divide-y">
                                {fields.map((field, index) => {
                                    const values = watchedItems?.[index];
                                    if (!values) return null;

                                    const calc = calculations.itemCalculations?.[index];

                                    return (
                                        <div key={field.id} className={cn("p-2 border-b flex gap-2 items-start hover:bg-muted/30 transition-colors", lastAddedIndex === index && "bg-blue-50/50")}>
                                            <div className="flex flex-row gap-1 justify-between w-full items-center">
                                                <div className="font-semibold text leading-tight">{values.name || "Item Unknown"}</div>
                                                <div className=" flex flex-wrap gap-2 items-center">

                                                    <Input
                                                        type="number"
                                                        ref={(el) => { qtyInputRefs.current[index] = el; }}
                                                        className="h-7 w-16 text-center font-mono font-bold text-sm px-1"
                                                        value={values.qty}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            const newQty = val === "" ? 0 : parseFloat(val);
                                                            form.setValue(`items.${index}.qty`, newQty);
                                                        }}
                                                        onKeyDown={(e) => {
                                                            if (e.key === "Enter") {
                                                                e.preventDefault();
                                                                barcodeInputRef.current?.focus();
                                                            }
                                                        }}
                                                        onBlur={(e) => {
                                                            // Reset to 1 if empty or 0 on blur
                                                            const val = parseFloat(e.target.value);
                                                            if (!val || val < 1) {
                                                                form.setValue(`items.${index}.qty`, 1);
                                                            }
                                                        }}
                                                    />
                                                    {/* Variant Selector */}
                                                    {values.variants && values.variants.length > 1 ? (
                                                        <Select
                                                            value={values.masterItemVariantId?.toString()}
                                                            onValueChange={(val) => changeVariant(index, val)}
                                                        >
                                                            <SelectTrigger className="h-6 text-sm px-2 font-normal w-auto min-w-[80px] border-dashed border-primary">
                                                                <SelectValue placeholder="Variant" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {values.variants.map((v: ItemVariant) => (
                                                                    <SelectItem key={v.id} value={v.id.toString()} className="">
                                                                        <span className="font-medium">{v.unit}</span>
                                                                        <span className="ml-1">
                                                                            (@{v.amount})
                                                                        </span>
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    ) : (
                                                        <Badge variant="outline" className="h-6 text-[10px] px-2 font-normal border-dashed">
                                                            {values.variantName} ({values.unit} @{values.amount})
                                                        </Badge>
                                                    )}
                                                    <div className="flex items-center gap-1">
                                                        {values.discounts?.map((d, dIdx) => (
                                                            <div key={dIdx} className="flex items-center bg-orange-100 text-orange-800 rounded px-1 h-5">
                                                                <span className="text-[10px] font-bold">{d.percentage}%</span>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-4 w-4 ml-1 text-orange-900 hover:bg-orange-200"
                                                                    onClick={() => removeDiscount(index, dIdx)}
                                                                >
                                                                    <X className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                        ))}
                                                        <Button
                                                            variant="ghost"
                                                            className="h-5 px-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                            onClick={() => addDiscount(index)}
                                                        >
                                                            <Plus className="h-3 w-3 mr-0.5" /> Disc %
                                                        </Button>
                                                    </div>

                                                    {/* Inline Discount Inputs */}
                                                    {values.discounts && values.discounts.length > 0 && (
                                                        <div className="flex flex-wrap gap-1">
                                                            {values.discounts.map((discount, dIndex) => (
                                                                <div key={dIndex} className="relative flex w-16 items-center">
                                                                    <Input
                                                                        className="h-6 text-xs pr-4 px-1 text-center"
                                                                        value={discount.percentage}
                                                                        onChange={(e) => updateDiscount(index, dIndex, e.target.value)}
                                                                        autoFocus={discount.percentage === 0}
                                                                    />
                                                                    <span className="absolute right-1 text-[10px] text-muted-foreground">%</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                            </div>

                                            {/* Qty & Price Controls */}
                                            <div className="flex flex-col items-end gap-1 mt-0.5">


                                                <div className="font-mono font-medium text-right mt-2">
                                                    {calc?.netTotal.toLocaleString("id-ID")}
                                                </div>
                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400 hover:text-red-500 hover:bg-red-50" onClick={() => remove(index)}>
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>

                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* RIGHT: Summary & Sidebar */}
            <div className="w-full lg:w-[420px] flex-none flex flex-col gap-4 overflow-hidden">

                {/* Member Card */}
                <Card className="flex-none">
                    <CardContent className="p-3 space-y-2">
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Input
                                    placeholder="Member..."
                                    {...form.register("memberCode")}
                                    className="font-mono h-8 text-sm"
                                    onKeyDown={handleMemberKeyDown}
                                />
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="absolute right-0 top-0 h-8 w-8 text-muted-foreground"
                                    onClick={handleVerifyMember}
                                    disabled={isVerifyingMember}
                                >
                                    {isVerifyingMember ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                        {memberVerified && (
                            <div className="flex items-center justify-between text-sm bg-green-50 text-green-700 p-2 rounded border border-green-100">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <User className="h-3 w-3 flex-none" />
                                    <span className="font-semibold truncate">{memberVerified.name}</span>
                                    <Badge variant="outline" className="bg-white text-green-800 border-green-200 text-[10px] h-5 px-1.5 flex-none">
                                        {memberVerified.masterMemberCategory?.name || "Member"}
                                    </Badge>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5 ml-1 text-red-500 hover:text-red-700 hover:bg-red-50"
                                    onClick={handleClearMember}
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            </div>
                        )}
                        <Button
                            variant="outline"
                            className="w-full border-dashed text-primary hover:text-primary/80 hover:bg-primary/5"
                            onClick={() => setIsCreateMemberOpen(true)}
                        >
                            <Plus className="mr-2 h-4 w-4" /> Daftar Member Baru
                        </Button>
                    </CardContent>
                </Card>

                <CreateMemberDialog
                    open={isCreateMemberOpen}
                    onOpenChange={setIsCreateMemberOpen}
                    onSuccess={handleCreateMemberSuccess}
                />

                {/* Summary Card */}
                <Card className="flex-1 flex flex-col shadow-lg border-primary/20 overflow-hidden">
                    <CardContent className="flex-1 p-4 space-y-3 overflow-y-auto">
                        <div className="space-y-1 text-sm">
                            <div className="flex justify-between text-muted-foreground">
                                <span>Subtotal</span>
                                <span>Rp {calculations.subTotal.toLocaleString("id-ID")}</span>
                            </div>
                            <div className="flex justify-between text-muted-foreground">
                                <span>Diskon</span>
                                <span className={calculations.discountTotal > 0 ? "text-red-500" : ""}>- Rp {calculations.discountTotal.toLocaleString("id-ID")}</span>
                            </div>
                        </div>
                        <Separator />
                        <div className="flex justify-between items-end">
                            <div className="text-sm font-medium text-muted-foreground">Total Bayar</div>
                            <div className="text-2xl font-bold text-primary">
                                Rp {calculations.grandTotal.toLocaleString("id-ID")}
                            </div>
                        </div>


                        <div className="space-y-4 pt-4 border-t">
                            <div className="space-y-1">
                                <span className="text-xs font-medium text-muted-foreground">Uang Diterima (Cash)</span>
                                <Input
                                    type="number"
                                    min="0"
                                    placeholder="0"
                                    className="text-right font-bold text-lg h-10"
                                    {...form.register("cashReceived")}
                                />
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs font-medium text-muted-foreground">Metode Bayar</span>
                                <Select
                                    onValueChange={(val) => form.setValue("paymentType", val as "CASH" | "DEBIT" | "QRIS")}
                                    defaultValue={form.watch("paymentType")}
                                >
                                    <SelectTrigger className="w-full text-right font-bold h-10">
                                        <SelectValue placeholder="Pilih Metode" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="CASH">CASH</SelectItem>
                                        <SelectItem value="DEBIT">DEBIT</SelectItem>
                                        <SelectItem value="QRIS">QRIS</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex justify-between items-end bg-blue-50 p-2 rounded">
                                <div className="text-sm font-medium text-blue-800">Kembalian</div>
                                <div className="text-lg font-bold text-blue-600">
                                    Rp {Math.max(0, (Number(form.watch("cashReceived")) || 0) - calculations.grandTotal).toLocaleString("id-ID")}
                                </div>
                            </div>
                        </div>
                    </CardContent>

                    <CardFooter className="p-3 bg-muted/10 border-t flex flex-col gap-2 flex-none">
                        <Textarea
                            placeholder="Catatan..."
                            className="min-h-[40px] h-10 resize-none text-xs py-2"
                            {...form.register("notes")}
                        />
                        <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                            <AlertDialogTrigger asChild>
                                {hasAccess &&
                                    <Button
                                        className="w-full h-12 text-lg font-bold shadow-md"
                                        size="lg"
                                        disabled={isCreating || fields.length === 0}
                                    >
                                        {isCreating ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CreditCard className="mr-2 h-5 w-5" />}
                                        BAYAR
                                    </Button>
                                }
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Konfirmasi Pembayaran</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Total transaksi sebesar <span className="font-bold text-primary">Rp {calculations.grandTotal.toLocaleString("id-ID")}</span>.
                                        <br />
                                        Pastikan uang yang diterima sudah sesuai. Lanjutkan?
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                    <AlertDialogAction onClick={(e) => {
                                        e.preventDefault(); // Prevent auto-close
                                        form.handleSubmit((values) => onSubmit(values, false))();
                                    }}
                                        className="bg-secondary text-secondary-foreground hover:bg-secondary/80"

                                    >
                                        Bayar Saja
                                    </AlertDialogAction>
                                    <AlertDialogAction
                                        onClick={(e) => {
                                            e.preventDefault();
                                            form.handleSubmit((values) => onSubmit(values, true))();
                                        }}
                                        disabled={isPrintingTransaction}
                                    >
                                        {isPrintingTransaction ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Printer className="mr-2 h-4 w-4" />}
                                        Bayar & Cetak
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </CardFooter>
                </Card>
            </div>
            {/* Hidden Receipt for Daily Report Printing */}
            <div style={{ display: "none" }}>
                {dailyReceiptData && (
                    <DailySalesReceipt ref={dailyReceiptRef} data={dailyReceiptData} />
                )}
            </div>

            {/* Hidden Receipt for Transaction Printing */}
            <div style={{ display: "none" }}>
                {transactionReceiptData && (
                    <Receipt ref={transactionReceiptRef} data={transactionReceiptData} />
                )}
            </div>
        </div >
    );
}
