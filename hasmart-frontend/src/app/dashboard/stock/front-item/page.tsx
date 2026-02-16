"use client";

import { useMemo, useState, useEffect } from "react";
import { useForm, useFieldArray, Resolver, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
    ColumnDef,
    getCoreRowModel,
    useReactTable,
    PaginationState,
    SortingState,
} from "@tanstack/react-table";
import {
    Loader2,
    Plus,
    Trash2,
    ArrowRightLeft,
} from "lucide-react";
import { toast } from "sonner";

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
import { Textarea } from "@/components/ui/textarea";

import { FrontStockItem } from "@/types/stock/front-stock";
import {
    useFrontStockItems,
    useCreateFrontStockTransfer,
} from "@/hooks/stock/use-front-stock";
import { useItems } from "@/hooks/master/use-item";
import { useDebounce } from "@/hooks/use-debounce";
import { DataTable } from "@/components/ui/data-table/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table/data-table-column-header";
import { DataTableToolbar } from "@/components/ui/data-table/data-table-toolbar";
import { Combobox } from "@/components/custom/combobox";
import { Item, ItemVariant } from "@/types/master/item";

import { useAccessControl, UserAccess } from "@/hooks/use-access-control";
import { useBranch } from "@/providers/branch-provider";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";
import { useModEnter } from "@/hooks/function/use-mod-enter";

// --- Validation Schema ---

const transferItemSchema = z.object({
    masterItemId: z.number().optional(), // Helper for UI, not sent to API
    masterVariantId: z.number().min(1, "Varian harus dipilih"),
    transferAmount: z.coerce.number().min(1, "Jumlah tidak boleh 0").or(z.coerce.number().max(-1, "Jumlah tidak boleh 0")),
}).refine((data) => data.transferAmount !== 0, { message: "Jumlah tidak boleh 0", path: ["transferAmount"] });

const transferSchema = z.object({
    branchId: z.number().optional(),
    notes: z.string().optional(),
    items: z.array(transferItemSchema).min(1, "Minimal satu item harus dipilih"),
});

type TransferFormValues = z.infer<typeof transferSchema>;

export default function FrontStockPage() {
    useAccessControl([UserAccess.accessFrontStockRead], true);
    const hasAccess = useAccessControl([UserAccess.accessFrontStockWrite], false);
    const { branch, isLoading: isBranchLoading } = useBranch();
    const router = useRouter();

    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: 10,
    });
    const [sorting, setSorting] = useState<SortingState>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearch = useDebounce(searchTerm, 500);
    const [isTransferOpen, setIsTransferOpen] = useState(false);

    // Fetch Inventory
    const { data: itemData, isLoading } = useFrontStockItems({
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        search: debouncedSearch,
        sort: sorting[0]?.desc ? "desc" : "asc",
        sortBy: sorting[0]?.id,
    });

    // Columns
    const columns = useMemo<ColumnDef<FrontStockItem>[]>(() => [
        {
            accessorKey: "code",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Kode" />,
        },
        {
            accessorKey: "name",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Nama Barang" />,
        },
        {
            accessorKey: "supplier",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Supplier" />,
        },
        {
            accessorKey: "category",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Kategori" />,
        },
        {
            accessorKey: "frontStock",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Stok Depan" />,
        },
        {
            accessorKey: "rearStock",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Stok Belakang" />,
        },
    ], []);

    const table = useReactTable({
        data: itemData?.data || [],
        columns,
        state: { pagination, sorting },
        pageCount: itemData?.pagination?.totalPages || -1,
        onPaginationChange: setPagination,
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        manualPagination: true,
        manualSorting: true,
    });

    if (isBranchLoading) return <div className="w-full h-full flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin" />
    </div>

    if (!branch && !isBranchLoading) {
        toast.error("Harap pilih cabang terlebih dahulu");
        router.push("/dashboard");
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">Front Stock</h2>
                {hasAccess && <Button onClick={() => setIsTransferOpen(true)}>
                    <ArrowRightLeft className="mr-2 h-4 w-4" />
                    Pindahkan Stok
                </Button>}
            </div>

            <DataTableToolbar
                table={table}
                filterValue={searchTerm}
                onFilterChange={setSearchTerm}
                placeholder="Cari item..."
            />
            <DataTable
                table={table}
                columnsLength={columns.length}
                isLoading={isLoading}
                showSelectedRowCount={false}
            />

            {/* Transfer Dialog */}
            <CreateTransferDialog
                open={isTransferOpen}
                onOpenChange={setIsTransferOpen}
            />
        </div>
    );
}

// --- Component: Create Transfer Dialog ---
function CreateTransferDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (v: boolean) => void }) {
    const { branch } = useBranch();
    const { mutate: createTransfer, isPending } = useCreateFrontStockTransfer();

    const form = useForm<TransferFormValues>({
        resolver: zodResolver(transferSchema) as Resolver<TransferFormValues>,
        defaultValues: {
            notes: "",
            items: [{ masterItemId: 0, masterVariantId: 0, transferAmount: 0 }],
        }
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "items"
    });

    const onSubmit = (values: TransferFormValues) => {
        if (!branch?.id) {
            toast.error("Cabang tidak dipilih");
            return;
        }

        const payload = {
            ...values,
            branchId: branch.id,
            // Strip helper fields if necessary, but TS usually ignores extra inputs if type strictly defined in DTO
        };

        createTransfer(payload, {
            onSuccess: () => {
                toast.success("Transfer berhasil dibuat");
                onOpenChange(false);
                form.reset();
            },
            onError: (err) => {
                toast.error(err instanceof AxiosError ? err.response?.data?.message : "Gagal membuat transfer");
            }
        });
    };

    useModEnter(() => append({
        masterVariantId: 0,
        transferAmount: 0,
        masterItemId: 0
    }), {
        enabled: open,
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px]">
                <DialogHeader>
                    <DialogTitle>Transfer Stok Depan</DialogTitle>
                    <DialogDescription>Pindahkan stok dari/ke Gudang Utama ke Front Stock</DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Catatan</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Catatan..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="space-y-2">
                            <div className="flex justify-between items-start">
                                <FormLabel>Barang</FormLabel>
                                <div className="flex flex-col items-end gap-2">
                                    <Button type="button" variant="outline" size="sm" onClick={() => append({ masterItemId: 0, masterVariantId: 0, transferAmount: 0 })}>
                                        <Plus className="h-4 w-4 mr-1" /> Tambah Barang
                                    </Button>
                                    <span className="text-xs text-muted-foreground">Atau tekan Ctrl+Enter</span>
                                </div>
                            </div>
                            <div className="max-h-[350px] overflow-y-auto space-y-2 p-1">
                                {fields.map((field, index) => (
                                    <TransferItemRow
                                        key={field.id}
                                        index={index}
                                        form={form}
                                        onRemove={() => remove(index)}
                                    />
                                ))}
                            </div>
                            <FormMessage>{form.formState.errors.items?.root?.message}</FormMessage>
                            <FormMessage>{form.formState.errors.items?.message}</FormMessage>
                        </div>

                        <DialogFooter>
                            <Button type="submit" disabled={isPending}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Simpan Transfer
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

function TransferItemRow({ index, form, onRemove }: { index: number, form: UseFormReturn<TransferFormValues>, onRemove: () => void }) {
    const [searchItem, setSearchItem] = useState("");
    const debouncedSearchItem = useDebounce(searchItem, 300);
    const [cachedItems, setCachedItems] = useState<Item[]>([]);
    const { data: items } = useItems({ search: debouncedSearchItem, limit: 20 });

    // Cache accumulation
    useEffect(() => {
        const fetchedItems = items?.data;
        if (fetchedItems) {
            setCachedItems(prev => {
                const map = new Map(prev.map(i => [i.id, i]));
                fetchedItems.forEach((item) => {
                    if (!map.has(item.id)) map.set(item.id, item);
                    else map.set(item.id, item);
                });
                return Array.from(map.values());
            });
        }
    }, [items?.data]);

    const itemOptions = useMemo(() => {
        const listItems = items?.data || [];
        const map = new Map();

        cachedItems.forEach(i => map.set(i.id, i));
        listItems.forEach(i => map.set(i.id, i));

        return Array.from(map.values());
    }, [cachedItems, items?.data]);

    const selectedItemId = form.watch(`items.${index}.masterItemId`); // Watch item selection
    const selectedItem = useMemo(() => itemOptions.find(i => i.id === selectedItemId), [itemOptions, selectedItemId]);
    const variants = selectedItem?.masterItemVariants || [];

    const handleItemSelect = (val: number) => {
        form.setValue(`items.${index}.masterItemId`, val);
        form.setValue(`items.${index}.masterVariantId`, 0); // Reset variant when item changes
    }

    return (
        <div className="flex gap-2 items-start p-2 border rounded-md">
            {/* Item Selection */}
            <div className="flex flex-col gap-2 flex-1">
                <FormField
                    control={form.control}
                    name={`items.${index}.masterItemId`}
                    render={({ field }) => (
                        <FormItem>
                            <Combobox
                                value={field.value}
                                onChange={(val) => handleItemSelect(val)}
                                options={itemOptions}
                                placeholder="Pilih Barang"
                                inputValue={searchItem}
                                onInputChange={setSearchItem}
                                filterString={searchItem}
                                renderLabel={(item) => <div className="flex flex-col"><span className="font-semibold">{item.name} - {item.code}</span></div>}
                            />
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="w-full flex flex-row gap-4">

                    <FormField
                        control={form.control}
                        name={`items.${index}.masterVariantId`}
                        render={({ field }) => (
                            <FormItem className="flex-1">
                                {/* <FormLabel className="text-xs">Varian</FormLabel> */}
                                <Select
                                    onValueChange={(val) => form.setValue(`items.${index}.masterVariantId`, parseInt(val))}
                                    value={field.value?.toString() !== "0" ? field.value?.toString() : undefined}
                                    disabled={!selectedItemId}
                                >
                                    <FormControl>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Pilih Varian" />
                                        </SelectTrigger>
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
                        )}
                    />
                    <FormField
                        control={form.control}
                        name={`items.${index}.transferAmount`}
                        render={({ field }) => (
                            <FormItem className="flex-1">
                                <FormControl>
                                    <Input
                                        type="number"
                                        placeholder="Jml"
                                        {...field}
                                        className="mt-0"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            </div>



            <Button type="button" variant="ghost" size="icon" onClick={onRemove} className="text-red-500">
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
    );
}