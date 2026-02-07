"use client";

import { useMemo, useState } from "react";

import { useBranch } from "@/providers/branch-provider";
import { Loader2, TrendingUp, TrendingDown, ShoppingCart, Package, AlertTriangle, BarChart3 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePickerWithRange } from "@/components/custom/date-picker-with-range";
import { DateRange } from "react-day-picker";
import { startOfMonth, endOfMonth, format } from "date-fns";
import {
    useFinancialSummary,
    useSalesTrend,
    useTopProducts,
    useStockAlerts,
} from "@/hooks/overview/use-overview";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart";
import { Area, AreaChart, XAxis, YAxis, CartesianGrid, Bar, BarChart } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useAccessControl, UserAccess } from "@/hooks/use-access-control";

const chartConfig = {
    value: {
        label: "Penjualan",
        color: "hsl(var(--chart-1))",
    },
} satisfies ChartConfig;

const barChartConfig = {
    soldQty: {
        label: "Terjual",
        color: "hsl(var(--chart-2))",
    },
} satisfies ChartConfig;

function formatCurrency(value: number): string {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
}

function formatCompact(value: number): string {
    if (value >= 1_000_000_000) {
        return `${(value / 1_000_000_000).toFixed(1)}M`;
    }
    if (value >= 1_000_000) {
        return `${(value / 1_000_000).toFixed(1)}Jt`;
    }
    if (value >= 1_000) {
        return `${(value / 1_000).toFixed(1)}Rb`;
    }
    return value.toString();
}

export default function OverviewPage() {
    const { branch, isLoading: branchLoading } = useBranch();

    useAccessControl([UserAccess.accessOverviewRead], true);

    // Default to current month
    const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
        const now = new Date();
        return {
            from: startOfMonth(now),
            to: endOfMonth(now),
        };
    });

    // Build filter params
    const filterParams = useMemo(() => ({
        dateStart: dateRange?.from?.toISOString(),
        dateEnd: dateRange?.to?.toISOString(),
    }), [dateRange]);

    // Fetch data
    const financialSummary = useFinancialSummary(filterParams);
    const salesTrend = useSalesTrend(filterParams);
    const topProducts = useTopProducts(filterParams);
    const stockAlerts = useStockAlerts({});

    if (branchLoading) {
        return (
            <div className="flex h-full items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const summary = financialSummary.data?.data;
    const trend = salesTrend.data?.data || [];
    const products = topProducts.data?.data || [];
    const alerts = stockAlerts.data?.data || [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Overview</h1>
                    <p className="text-muted-foreground">
                        {branch ? (
                            <>
                                Dashboard cabang <strong>{branch?.name}</strong>
                            </>
                        ) : (
                            "Menampilkan semua ringkasan data"
                        )}
                    </p>
                </div>
                <DatePickerWithRange date={dateRange} setDate={setDateRange} />
            </div>

            {/* Financial Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Net Sales */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Omzet Bersih</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {financialSummary.isLoading ? (
                            <Skeleton className="h-8 w-32" />
                        ) : (
                            <>
                                <div className="text-2xl font-bold text-green-600">
                                    {formatCurrency(summary?.netSales || 0)}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Gross: {formatCurrency(summary?.grossSales || 0)}
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Total Returns */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Retur</CardTitle>
                        <TrendingDown className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {financialSummary.isLoading ? (
                            <Skeleton className="h-8 w-32" />
                        ) : (
                            <>
                                <div className="text-2xl font-bold text-red-600">
                                    {formatCurrency(summary?.totalReturns || 0)}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Pengurang omzet
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Net Purchase */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pengeluaran Beli</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {financialSummary.isLoading ? (
                            <Skeleton className="h-8 w-32" />
                        ) : (
                            <>
                                <div className="text-2xl font-bold text-orange-600">
                                    {formatCurrency(summary?.netPurchase || 0)}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Total belanja bersih
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Transaction Count */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Jumlah Transaksi</CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {financialSummary.isLoading ? (
                            <Skeleton className="h-8 w-20" />
                        ) : (
                            <>
                                <div className="text-2xl font-bold">
                                    {summary?.transactionCount || 0}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Total transaksi penjualan
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row */}
            <div className="grid gap-4 md:grid-cols-2">
                {/* Sales Trend Chart */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Tren Penjualan</CardTitle>
                        <CardDescription>Penjualan harian dalam periode</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {salesTrend.isLoading ? (
                            <div className="flex h-[250px] items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : trend.length === 0 ? (
                            <div className="flex h-[250px] items-center justify-center text-muted-foreground">
                                Belum ada data penjualan
                            </div>
                        ) : (
                            <ChartContainer config={chartConfig} className="h-[250px] w-full">
                                <AreaChart data={trend} margin={{ left: 0, right: 12 }}>
                                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="date"
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={8}
                                        tickFormatter={(value) => format(new Date(value), "dd/MM")}
                                    />
                                    <YAxis
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={8}
                                        tickFormatter={formatCompact}
                                    />
                                    <ChartTooltip
                                        content={
                                            <ChartTooltipContent
                                                labelFormatter={(value) => format(new Date(value), "dd MMM yyyy")}
                                                formatter={(value) => formatCurrency(value as number)}
                                            />
                                        }
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="value"
                                        stroke="var(--color-value)"
                                        fill="var(--color-value)"
                                        fillOpacity={0.3}
                                    />
                                </AreaChart>
                            </ChartContainer>
                        )}
                    </CardContent>
                </Card>

                {/* Top Products Chart */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Produk Terlaris</CardTitle>
                        <CardDescription>5 produk dengan penjualan tertinggi</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {topProducts.isLoading ? (
                            <div className="flex h-[250px] items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : products.length === 0 ? (
                            <div className="flex h-[250px] items-center justify-center text-muted-foreground">
                                Belum ada data produk
                            </div>
                        ) : (
                            <ChartContainer config={barChartConfig} className="h-[250px] w-full">
                                <BarChart data={products} layout="vertical" margin={{ left: 80, right: 12 }}>
                                    <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                                    <XAxis type="number" tickLine={false} axisLine={false} />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={8}
                                        width={75}
                                        tick={{ fontSize: 11 }}
                                    />
                                    <ChartTooltip
                                        content={
                                            <ChartTooltipContent
                                                formatter={(value, name) =>
                                                    name === "soldQty"
                                                        ? `${value} unit`
                                                        : formatCurrency(value as number)
                                                }
                                            />
                                        }
                                    />
                                    <Bar
                                        dataKey="soldQty"
                                        fill="var(--color-soldQty)"
                                        radius={[0, 4, 4, 0]}
                                    />
                                </BarChart>
                            </ChartContainer>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Stock Alerts */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                        <CardTitle>Stok Menipis</CardTitle>
                    </div>
                    <CardDescription>Barang dengan stok ≤ 10 unit</CardDescription>
                </CardHeader>
                <CardContent>
                    {stockAlerts.isLoading ? (
                        <div className="flex h-20 items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : alerts.length === 0 ? (
                        <div className="flex h-20 items-center justify-center text-muted-foreground">
                            <Package className="mr-2 h-5 w-5" />
                            Semua stok aman
                        </div>
                    ) : (
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                            {alerts.map((item, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between rounded-lg border p-3"
                                >
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium leading-none">{item.name}</p>
                                        <p className="text-xs text-muted-foreground">{item.code}</p>
                                    </div>
                                    <Badge
                                        variant={item.currentStock <= 3 ? "destructive" : "secondary"}
                                        className="ml-2 shrink-0"
                                    >
                                        {item.currentStock} {item.unit}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
