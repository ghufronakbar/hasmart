import { UserAccess } from "@/hooks/use-access-control";
import { LayoutDashboard, Database, FileText, Settings, ShoppingBasketIcon, Receipt, LampDeskIcon } from "lucide-react";

export type MenuItem = {
    title: string;
    href?: string;
    icon?: React.ReactNode;
    children?: MenuItem[];
    access?: UserAccess;
};

export const menuItems: MenuItem[] = [
    {
        title: "Dasbor",
        href: "/dashboard/overview",
        icon: <LayoutDashboard className="h-4 w-4" />,
        access: UserAccess.accessOverviewRead,
    },
    {
        title: "Laporan",
        href: "/dashboard/report",
        icon: <FileText className="h-4 w-4" />,
        access: UserAccess.accessReportRead,
    },
    {
        title: "Point of Sales",
        href: "/dashboard/point-of-sales",
        icon: <ShoppingBasketIcon className="h-4 w-4" />,
        access: UserAccess.accessPointOfSalesRead,
    },
    {
        title: "Label Harga",
        href: "/dashboard/label-prepare",
        icon: <Receipt className="h-4 w-4" />,
        access: UserAccess.accessPrintLabelRead,
    },
    {
        title: "Stok Depan",
        icon: <LampDeskIcon className="h-4 w-4" />,
        children: [
            {
                title: "Stok Depan",
                href: "/dashboard/front-stock/item",
                access: UserAccess.accessFrontStockRead,
            },
            {
                title: "Riwayat Transfer Stok Depan",
                href: "/dashboard/front-stock/transfer-history",
                access: UserAccess.accessFrontStockHistoryRead,
            }
        ]
    },
    {
        title: "Aplikasi",
        icon: <Settings className="h-4 w-4" />,
        children: [
            { title: "Pengguna", href: "/dashboard/app/user", access: UserAccess.accessAppUserRead },
            { title: "Cabang", href: "/dashboard/app/branch", },
        ],
    },
    {
        title: "Data Master",
        icon: <Database className="h-4 w-4" />,
        children: [
            { title: "Barang", href: "/dashboard/master/items", access: UserAccess.accessMasterItemRead },
            { title: "Kategori Barang", href: "/dashboard/master/item-categories", access: UserAccess.accessMasterItemCategoryRead },
            { title: "Pelanggan", href: "/dashboard/master/members", access: UserAccess.accessMasterMemberRead },
            { title: "Kategori Pelanggan", href: "/dashboard/master/member-categories", access: UserAccess.accessMasterMemberCategoryRead },
            { title: "Pemasok", href: "/dashboard/master/suppliers", access: UserAccess.accessMasterSupplierRead },
            { title: "Satuan", href: "/dashboard/master/units", access: UserAccess.accessMasterUnitRead },
        ],
    },
    {
        title: "Transaksi",
        icon: <FileText className="h-4 w-4" />,
        children: [
            { title: "Pembelian", href: "/dashboard/transaction/purchase", access: UserAccess.accessTransactionPurchaseRead },
            { title: "Retur Pembelian", href: "/dashboard/transaction/purchase-return", access: UserAccess.accessTransactionPurchaseReturnRead },
            { title: "Kasir", href: "/dashboard/transaction/sales", access: UserAccess.accessTransactionSalesRead },
            { title: "Retur Kasir", href: "/dashboard/transaction/sales-return", access: UserAccess.accessTransactionSalesReturnRead },
            { title: "Penjualan", href: "/dashboard/transaction/sell", access: UserAccess.accessTransactionSellRead },
            { title: "Retur Penjualan", href: "/dashboard/transaction/sell-return", access: UserAccess.accessTransactionSellReturnRead },
            { title: "Penyesuaian Stok", href: "/dashboard/transaction/adjust-stock", access: UserAccess.accessTransactionAdjustmentRead },
            { title: "Transfer Stok", href: "/dashboard/transaction/transfer", access: UserAccess.accessTransactionTransferRead },
            { title: "Kas Keluar Masuk", href: "/dashboard/transaction/cash-flow", access: UserAccess.accessTransactionCashFlowRead },
        ],
    },
    {
        title: "Backup & Restore",
        href: "/dashboard/backup-restore",
        icon: <Settings className="h-4 w-4" />,
        access: UserAccess.isSuperUser,
    }
];
