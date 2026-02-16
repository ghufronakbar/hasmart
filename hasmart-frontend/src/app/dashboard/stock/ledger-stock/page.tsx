"use client";

import { useMemo, useState } from "react";
import {
    ColumnDef,
    getCoreRowModel,
    useReactTable,
    PaginationState,
    SortingState,
} from "@tanstack/react-table";
import { Loader2, X } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { DateRange } from "react-day-picker";


import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table/data-table-column-header";
import { Combobox } from "@/components/custom/combobox";
import { DatePickerWithRange } from "@/components/custom/date-picker-with-range";

import { useLedgerStock } from "@/hooks/stock/use-ledger-stock";
import { useItems } from "@/hooks/master/use-item";
import { useDebounce } from "@/hooks/use-debounce";
import { useBranch } from "@/providers/branch-provider";
import { useAccessControl, UserAccess } from "@/hooks/use-access-control";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
    LedgerStockItem,
    LedgerStockModelType,
    LedgerStockActionType,
} from "@/types/stock/ledger-stock";

// --- Label Helpers ---

const MODEL_TYPE_LABELS: Record<LedgerStockModelType, string> = {
    TRANSACTION_PURCHASE: "Pembelian",
    TRANSACTION_PURCHASE_RETURN: "Retur Pembelian",
    TRANSACTION_SALES: "Penjualan (Kasir)",
    TRANSACTION_SALES_RETURN: "Retur Penjualan",
    TRANSACTION_SELL: "Penjualan (B2B)",
    TRANSACTION_SELL_RETURN: "Retur Penjualan B2B",
    TRANSACTION_TRANSFER_IN: "Transfer Masuk",
    TRANSACTION_TRANSFER_OUT: "Transfer Keluar",
    TRANSACTION_ADJUSTMENT: "Penyesuaian",
};

const ACTION_TYPE_LABELS: Record<LedgerStockActionType, string> = {
    CREATE: "Buat",
    UPDATE: "Ubah",
    DELETE: "Hapus",
};

const MODEL_TYPE_COLORS: Record<LedgerStockModelType, string> = {
    TRANSACTION_PURCHASE: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    TRANSACTION_PURCHASE_RETURN: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
    TRANSACTION_SALES: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    TRANSACTION_SALES_RETURN: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    TRANSACTION_SELL: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
    TRANSACTION_SELL_RETURN: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
    TRANSACTION_TRANSFER_IN: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    TRANSACTION_TRANSFER_OUT: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
    TRANSACTION_ADJUSTMENT: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
};

const ACTION_TYPE_COLORS: Record<LedgerStockActionType, string> = {
    CREATE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    UPDATE: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    DELETE: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

export default function LedgerStockPage() {
    useAccessControl([UserAccess.accessLedgerStockRead], true);
    const { branch, isLoading: isBranchLoading } = useBranch();
    const router = useRouter();

    // --- Filter States ---
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: 10,
    });
    const [sorting, setSorting] = useState<SortingState>([
        { id: "transactionDate", desc: true },
    ]);
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

    // Model type & action type filters
    const [modelType, setModelType] = useState<LedgerStockModelType | "ALL">("ALL");
    const [actionType, setActionType] = useState<LedgerStockActionType | "ALL">("ALL");

    // Master item combobox search
    const [selectedItemId, setSelectedItemId] = useState<number | undefined>(undefined);
    const [searchItem, setSearchItem] = useState("");
    const debouncedSearchItem = useDebounce(searchItem, 300);

    const { data: itemsData } = useItems({
        limit: 20,
        search: debouncedSearchItem,
        sortBy: "name",
        sort: "asc",
    });

    const itemOptions = useMemo(() => {
        return itemsData?.data?.map((item) => ({
            id: item.id,
            name: item.name,
            code: item.code,
        })) || [];
    }, [itemsData?.data]);

    // --- Query ---
    const { data: ledgerData, isLoading } = useLedgerStock({
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        sortBy: (sorting[0]?.id as "createdAt" | "transactionDate") || "transactionDate",
        sort: sorting[0]?.desc ? "desc" : "asc",
        dateStart: dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
        dateEnd: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
        modelType: modelType !== "ALL" ? modelType : undefined,
        actionType: actionType !== "ALL" ? actionType : undefined,
        masterItemId: selectedItemId,
    });

    // --- Table Columns ---
    const columns = useMemo<ColumnDef<LedgerStockItem>[]>(() => [
        {
            accessorKey: "transactionDate",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Tanggal" />,
            cell: ({ row }) =>
                format(new Date(row.getValue("transactionDate")), "dd MMM yyyy HH:mm", { locale: idLocale }),
        },
        {
            accessorKey: "masterItem.name",
            id: "masterItemName",
            header: "Barang",
            cell: ({ row }) => (
                <span className="font-medium">{row.original.masterItem?.name || "-"}</span>
            ),
        },
        {
            accessorKey: "modelType",
            header: "Tipe Transaksi",
            cell: ({ row }) => {
                const mt = row.original.modelType;
                return (
                    <Badge variant="secondary" className={`text-xs ${MODEL_TYPE_COLORS[mt] || ""}`}>
                        {MODEL_TYPE_LABELS[mt] || mt}
                    </Badge>
                );
            },
        },
        {
            accessorKey: "actionType",
            header: "Aksi",
            cell: ({ row }) => {
                const at = row.original.actionType;
                return (
                    <Badge variant="secondary" className={`text-xs ${ACTION_TYPE_COLORS[at] || ""}`}>
                        {ACTION_TYPE_LABELS[at] || at}
                    </Badge>
                );
            },
        },
        {
            accessorKey: "gapAmount",
            header: "Perubahan",
            cell: ({ row }) => {
                const val = row.original.gapAmount;
                const isPositive = val > 0;
                return (
                    <div className={`text-right font-bold ${isPositive ? "text-green-600" : val < 0 ? "text-red-600" : ""}`}>
                        {isPositive ? `+${val}` : val}
                    </div>
                );
            },
        },
        {
            accessorKey: "recordedStockAfterAmount",
            header: "Stok Setelah",
            cell: ({ row }) => (
                <div className="text-right font-medium">{row.original.recordedStockAfterAmount}</div>
            ),
        },
        {
            accessorKey: "invoiceNumberReff",
            header: "Referensi",
            cell: ({ row }) => (
                <span className="text-sm">{row.original.invoiceNumberReff || "-"}</span>
            ),
        },
        {
            accessorKey: "additionalNote",
            header: "Keterangan",
            cell: ({ row }) => (
                <div className="max-w-[200px] truncate text-sm text-muted-foreground" title={row.original.additionalNote}>
                    {row.original.additionalNote || "-"}
                </div>
            ),
        },
        {
            accessorKey: "user.name",
            id: "userName",
            header: "User",
            cell: ({ row }) => row.original.user?.name || "-",
        },
        {
            accessorKey: "createdAt",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Tanggal Dibuat" />,
            cell: ({ row }) =>
                format(new Date(row.getValue("createdAt")), "dd MMM yyyy HH:mm", { locale: idLocale }),
        },
    ], []);

    const table = useReactTable({
        data: ledgerData?.data || [],
        columns,
        state: { pagination, sorting },
        pageCount: ledgerData?.pagination?.totalPages || -1,
        onPaginationChange: setPagination,
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        manualPagination: true,
        manualSorting: true,
    });

    if (isBranchLoading) return (
        <div className="w-full h-full flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin" />
        </div>
    );

    if (!branch && !isBranchLoading) {
        toast.error("Harap pilih cabang terlebih dahulu");
        router.push("/dashboard");
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">Transaksi Stok</h2>
            </div>

            {/* Filter Toolbar */}
            <div className="flex flex-col gap-3">
                {/* Row 1: Date + Item Search */}
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    <div className="w-full sm:w-[250px]">
                        <Combobox
                            value={selectedItemId}
                            onChange={(val) => {
                                setSelectedItemId(val || undefined);
                                setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                            }}
                            options={itemOptions}
                            placeholder="Filter Barang..."
                            searchPlaceholder="Cari barang..."
                            inputValue={searchItem}
                            onInputChange={setSearchItem}
                            filterString={searchItem}
                            renderLabel={(item) => (
                                <span>{item.code ? `${item.code} - ` : ""}{item.name}</span>
                            )}
                        />
                    </div>
                    {selectedItemId && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setSelectedItemId(undefined);
                                setSearchItem("");
                                setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                            }}
                        >
                            <X className="h-4 w-4 mr-1" /> Reset Barang
                        </Button>
                    )}
                    <div className="flex items-center gap-2 ml-auto">
                        <DatePickerWithRange date={dateRange} setDate={setDateRange} />
                        {dateRange && (
                            <Button variant="ghost" size="icon" onClick={() => setDateRange(undefined)}>
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>

                {/* Row 2: Model type + Action type filters */}
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    <Select
                        value={modelType}
                        onValueChange={(v) => {
                            setModelType(v as LedgerStockModelType | "ALL");
                            setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                        }}
                    >
                        <SelectTrigger className="w-full sm:w-[220px]">
                            <SelectValue placeholder="Semua Tipe Transaksi" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Semua Tipe Transaksi</SelectItem>
                            {Object.entries(MODEL_TYPE_LABELS).map(([key, label]) => (
                                <SelectItem key={key} value={key}>{label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={actionType}
                        onValueChange={(v) => {
                            setActionType(v as LedgerStockActionType | "ALL");
                            setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                        }}
                    >
                        <SelectTrigger className="w-full sm:w-[160px]">
                            <SelectValue placeholder="Semua Aksi" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Semua Aksi</SelectItem>
                            {Object.entries(ACTION_TYPE_LABELS).map(([key, label]) => (
                                <SelectItem key={key} value={key}>{label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Data Table */}
            <DataTable
                table={table}
                columnsLength={columns.length}
                isLoading={isLoading}
                showSelectedRowCount={false}
            />
        </div>
    );
}