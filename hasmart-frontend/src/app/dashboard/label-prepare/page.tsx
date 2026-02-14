"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Loader2,
    ChevronLeft,
    ChevronRight,
    X,
    ArrowUpDown,
    Printer,
    Search
} from "lucide-react";
import { PaginationState, SortingState } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

import { useItems } from "@/hooks/master/use-item";
import { useDebounce } from "@/hooks/use-debounce";
import { useAccessControl, UserAccess } from "@/hooks/use-access-control";

export default function LabelPreparePage() {
    useAccessControl([UserAccess.accessPrintLabelRead], true);
    const router = useRouter();

    // --- State ---
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: 10,
    });
    const [sorting, setSorting] = useState<SortingState>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearch = useDebounce(searchTerm, 500);

    const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);
    const [onlyBaseUnit, setOnlyBaseUnit] = useState(false);

    // --- Hooks ---
    const { data: itemData, isLoading: isItemLoading } = useItems({
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        search: debouncedSearch,
        sort: sorting[0]?.desc ? "desc" : "asc",
        sortBy: sorting[0]?.id,
    });

    // --- Handlers ---
    const handleItemSelection = (itemId: number, checked: boolean) => {
        if (checked) {
            setSelectedItemIds(prev => [...prev, itemId]);
        } else {
            setSelectedItemIds(prev => prev.filter(id => id !== itemId));
        }
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked && itemData?.data) {
            const allIds = itemData.data.map(item => item.id);
            // Merge unique IDs
            setSelectedItemIds(prev => Array.from(new Set([...prev, ...allIds])));
        } else if (!checked && itemData?.data) {
            // Uncheck only visible items? Or all? Usually "Batal" unchecks all.
            // For checking "Select All" usually implies visible page in server-side pagination contexts,
            // or we could clear all. Let's start with clearing visible items from selection.
            const visibleIds = itemData.data.map(item => item.id);
            setSelectedItemIds(prev => prev.filter(id => !visibleIds.includes(id)));
        }
    };

    const handlePrintSelection = () => {
        if (selectedItemIds.length === 0) return;
        const ids = selectedItemIds.join(",");
        router.push(`/dashboard/label?id=${ids}&onlyBaseUnit=${onlyBaseUnit}`);
    };

    // Check if all visible items are selected
    const isAllVisibleSelected = (itemData?.data?.length || 0) > 0 && itemData?.data?.every(item => selectedItemIds.includes(item.id));

    return (
        <div className="space-y-4">
            <div className="flex items-start justify-between">
                <h2 className="text-2xl font-bold tracking-tight">Cetak Label Harga</h2>
                <div className="flex flex-col gap-2">
                    <Button onClick={handlePrintSelection} disabled={selectedItemIds.length === 0}>
                        <Printer className="mr-2 h-4 w-4" />
                        Cetak {selectedItemIds.length > 0 ? `(${selectedItemIds.length})` : ""}
                    </Button>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            checked={onlyBaseUnit}
                            onCheckedChange={(checked) => setOnlyBaseUnit(!!checked)}
                        />
                        <span className="text-sm font-medium">Hanya Satuan Dasar</span>
                    </div>
                </div>
            </div>

            {/* Filter */}
            <div className="flex items-center justify-between">
                <div className="flex flex-1 items-center space-x-2">
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Cari item..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-9 pl-8 w-[250px]"
                        />
                    </div>
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

            {/* Table */}
            <div className="rounded-md border mb-16 lg:mb-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">
                                <Checkbox
                                    checked={isAllVisibleSelected}
                                    onCheckedChange={(c) => handleSelectAll(!!c)}
                                />
                            </TableHead>
                            <TableHead >
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
                            <TableHead >
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
                            <TableHead >
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
                            <TableHead >
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
                            <TableHead>Varian & Harga</TableHead>
                            {/* <TableHead>Stok</TableHead> */}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isItemLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin inline" /> Loading...
                                </TableCell>
                            </TableRow>
                        ) : itemData?.data?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    Tidak ada data item.
                                </TableCell>
                            </TableRow>
                        ) : (
                            itemData?.data?.map((item) => {
                                const isSelected = selectedItemIds.includes(item.id);
                                return (
                                    <TableRow key={item.id} className={isSelected ? "bg-muted/50" : ""}>
                                        <TableCell>
                                            <Checkbox
                                                checked={isSelected}
                                                onCheckedChange={(c) => handleItemSelection(item.id, !!c)}
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {item.code}
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-semibold">{item.name}</div>
                                            <div className="flex gap-2 mt-1">
                                                {item.isActive ? (
                                                    <Badge variant="outline" className="text-xs py-0 h-5">Aktif</Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="text-xs py-0 h-5">Nonaktif</Badge>
                                                )}
                                                {item.masterItemCategory && (
                                                    <Badge variant="secondary" className="text-xs py-0 h-5">
                                                        {item.masterItemCategory.name}
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {item.masterItemCategory?.name}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {item.masterSupplier?.name}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1 text-sm">
                                                {item.masterItemVariants?.map(v => (
                                                    <div key={v.id} className="flex justify-between items-center bg-gray-50 dark:bg-gray-900/50 p-1 rounded px-2 max-w-[250px]">
                                                        <span className="font-mono text-xs text-muted-foreground">{v.unit}</span>
                                                        <span className="font-medium">
                                                            {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(v.sellPrice))}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </TableCell>
                                        {/* <TableCell>
                                            {item.stock}
                                        </TableCell> */}
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                    {selectedItemIds.length} item dipilih.
                </div>
                <div className="flex items-center space-x-2 mt-4">
                    <div className="flex items-center space-x-2">
                        <p className="text-sm text-muted-foreground hidden lg:block">Rows per page</p>
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

            {/* Sticky Mobile Fab */}
            {selectedItemIds.length > 0 && (
                <div className="fixed bottom-4 right-4 z-50 lg:hidden">
                    <Button onClick={handlePrintSelection} size="lg" className="shadow-xl">
                        <Printer className="mr-2 h-4 w-4" />
                        Cetak ({selectedItemIds.length})
                    </Button>
                </div>
            )}
        </div>
    );
}