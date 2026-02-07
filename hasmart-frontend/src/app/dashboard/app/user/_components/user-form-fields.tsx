"use client";

import { UseFormReturn } from "react-hook-form";
import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

interface UserFormFieldsProps {
    mode: "create" | "edit-access";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    form: UseFormReturn<any>;
}

// Group definitions for bulk actions
const GROUPS = {
    overview: {
        read: ["accessOverviewRead", "accessPointOfSalesRead", "accessReportRead", "accessPrintLabelRead", "accessFrontStockRead", "accessFrontStockHistoryRead"],
        write: ["accessPointOfSalesWrite", "accessFrontStockWrite"],
    },
    application: {
        read: ["accessAppUserRead"],
        write: ["accessAppUserWrite", "accessAppBranchWrite"],
    },
    master: {
        read: [
            "accessMasterItemRead",
            "accessMasterItemCategoryRead",
            "accessMasterMemberRead",
            "accessMasterMemberCategoryRead",
            "accessMasterSupplierRead",
            "accessMasterUnitRead",
        ],
        write: [
            "accessMasterItemWrite",
            "accessMasterItemCategoryWrite",
            "accessMasterMemberWrite",
            "accessMasterMemberCategoryWrite",
            "accessMasterSupplierWrite",
            "accessMasterUnitWrite",
        ],
    },
    transaction: {
        read: [
            "accessTransactionPurchaseRead",
            "accessTransactionPurchaseReturnRead",
            "accessTransactionSalesRead",
            "accessTransactionSalesReturnRead",
            "accessTransactionSellRead",
            "accessTransactionSellReturnRead",
            "accessTransactionTransferRead",
            "accessTransactionAdjustmentRead",
            "accessTransactionCashFlowRead",
        ],
        write: [
            "accessTransactionPurchaseWrite",
            "accessTransactionPurchaseReturnWrite",
            "accessTransactionSalesWrite",
            "accessTransactionSalesReturnWrite",
            "accessTransactionSellWrite",
            "accessTransactionSellReturnWrite",
            "accessTransactionTransferWrite",
            "accessTransactionAdjustmentWrite",
            "accessTransactionCashFlowWrite",
        ],
    },
};

const ALL_ACCESS_FIELDS = [
    ...GROUPS.overview.read, ...GROUPS.overview.write,
    ...GROUPS.application.read, ...GROUPS.application.write,
    ...GROUPS.master.read, ...GROUPS.master.write,
    ...GROUPS.transaction.read, ...GROUPS.transaction.write,
];

export function UserFormFields({ mode, form }: UserFormFieldsProps) {
    return (
        <ScrollArea className="max-h-[60vh] pr-4 overflow-auto max-w-[60vw]! w-full">
            <div className="space-y-6">
                {mode === "create" && (
                    <div className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nama Pengguna</FormLabel>
                                    <FormControl>
                                        <Input placeholder="cth: KASIR1" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Password</FormLabel>
                                    <FormControl>
                                        <Input type="password" placeholder="******" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="isActive"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                    <div className="space-y-0.5">
                                        <FormLabel>Aktif</FormLabel>
                                        <FormDescription>
                                            Pengguna aktif dapat login ke sistem.
                                        </FormDescription>
                                    </div>
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        <Separator />
                    </div>
                )}

                {/* Global Actions */}
                <div className="bg-muted/30 p-4 rounded-lg border">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h4 className="font-medium">Hak Akses Cepat</h4>
                            <p className="text-xs text-muted-foreground">Atur seluruh akses sekaligus</p>
                        </div>
                        <GroupCheckbox
                            form={form}
                            fields={ALL_ACCESS_FIELDS}
                            label="Izinkan Semua Akses"
                            className="font-semibold"
                        />
                    </div>
                </div>

                {/* Overview & POS */}
                <div className="space-y-3">
                    <SectionHeader
                        title="General"
                        form={form}
                        readFields={GROUPS.overview.read}
                        writeFields={GROUPS.overview.write}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <AccessCheckbox form={form} name="accessOverviewRead" label="Lihat Ringkasan" />
                        <AccessCheckbox form={form} name="accessReportRead" label="Lihat Laporan" />
                        <AccessCheckbox form={form} name="accessPointOfSalesRead" label="Lihat POS" />
                        <AccessCheckbox form={form} name="accessPointOfSalesWrite" label="Kelola POS" />
                        <AccessCheckbox form={form} name="accessPrintLabelRead" label="Cetak Label" />
                        <AccessCheckbox form={form} name="accessFrontStockRead" label="Lihat Stok Depan" />
                        <AccessCheckbox form={form} name="accessFrontStockWrite" label="Kelola Stok Depan" />
                        <AccessCheckbox form={form} name="accessFrontStockHistoryRead" label="Lihat Riwayat Transfer Stok Depan" />
                    </div>
                </div>

                {/* Application */}
                <div className="space-y-3">
                    <SectionHeader
                        title="Aplikasi"
                        form={form}
                        readFields={GROUPS.application.read}
                        writeFields={GROUPS.application.write}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <AccessCheckbox form={form} name="accessAppUserRead" label="Lihat Pengguna" />
                        <AccessCheckbox form={form} name="accessAppUserWrite" label="Kelola Pengguna" />
                        <AccessCheckbox form={form} name="accessAppBranchWrite" label="Kelola Cabang" />
                    </div>
                </div>

                {/* Master Data */}
                <div className="space-y-3">
                    <SectionHeader
                        title="Data Master"
                        form={form}
                        readFields={GROUPS.master.read}
                        writeFields={GROUPS.master.write}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <AccessCheckbox form={form} name="accessMasterItemRead" label="Lihat Barang" />
                        <AccessCheckbox form={form} name="accessMasterItemWrite" label="Kelola Barang" />
                        <AccessCheckbox form={form} name="accessMasterItemCategoryRead" label="Lihat Kategori Barang" />
                        <AccessCheckbox form={form} name="accessMasterItemCategoryWrite" label="Kelola Kategori Barang" />
                        <AccessCheckbox form={form} name="accessMasterMemberRead" label="Lihat Pelanggan" />
                        <AccessCheckbox form={form} name="accessMasterMemberWrite" label="Kelola Pelanggan" />
                        <AccessCheckbox form={form} name="accessMasterMemberCategoryRead" label="Lihat Kategori Pelanggan" />
                        <AccessCheckbox form={form} name="accessMasterMemberCategoryWrite" label="Kelola Kategori Pelanggan" />
                        <AccessCheckbox form={form} name="accessMasterSupplierRead" label="Lihat Supplier" />
                        <AccessCheckbox form={form} name="accessMasterSupplierWrite" label="Kelola Supplier" />
                        <AccessCheckbox form={form} name="accessMasterUnitRead" label="Lihat Satuan" />
                        <AccessCheckbox form={form} name="accessMasterUnitWrite" label="Kelola Satuan" />
                    </div>
                </div>

                {/* Transactions */}
                <div className="space-y-3">
                    <SectionHeader
                        title="Transaksi"
                        form={form}
                        readFields={GROUPS.transaction.read}
                        writeFields={GROUPS.transaction.write}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <AccessCheckbox form={form} name="accessTransactionPurchaseRead" label="Lihat Pembelian" />
                        <AccessCheckbox form={form} name="accessTransactionPurchaseWrite" label="Kelola Pembelian" />
                        <AccessCheckbox form={form} name="accessTransactionPurchaseReturnRead" label="Lihat Retur Pembelian" />
                        <AccessCheckbox form={form} name="accessTransactionPurchaseReturnWrite" label="Kelola Retur Pembelian" />
                        <AccessCheckbox form={form} name="accessTransactionSalesRead" label="Lihat Kasir" />
                        <AccessCheckbox form={form} name="accessTransactionSalesWrite" label="Kelola Kasir" />
                        <AccessCheckbox form={form} name="accessTransactionSalesReturnRead" label="Lihat Retur Kasir" />
                        <AccessCheckbox form={form} name="accessTransactionSalesReturnWrite" label="Kelola Retur Kasir" />
                        <AccessCheckbox form={form} name="accessTransactionSellRead" label="Lihat Penjualan" />
                        <AccessCheckbox form={form} name="accessTransactionSellWrite" label="Kelola Penjualan" />
                        <AccessCheckbox form={form} name="accessTransactionSellReturnRead" label="Lihat Retur Penjualan" />
                        <AccessCheckbox form={form} name="accessTransactionSellReturnWrite" label="Kelola Retur Penjualan" />
                        <AccessCheckbox form={form} name="accessTransactionTransferRead" label="Lihat Transfer Stok" />
                        <AccessCheckbox form={form} name="accessTransactionTransferWrite" label="Kelola Transfer Stok" />
                        <AccessCheckbox form={form} name="accessTransactionAdjustmentRead" label="Lihat Penyesuaian Stok" />
                        <AccessCheckbox form={form} name="accessTransactionAdjustmentWrite" label="Kelola Penyesuaian Stok" />
                        <AccessCheckbox form={form} name="accessTransactionCashFlowRead" label="Lihat Arus Kas" />
                        <AccessCheckbox form={form} name="accessTransactionCashFlowWrite" label="Kelola Arus Kas" />
                    </div>
                </div>
            </div>
        </ScrollArea>
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function AccessCheckbox({ form, name, label }: { form: UseFormReturn<any>; name: string; label: string }) {
    return (
        <FormField
            control={form.control}
            name={name}
            render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                    <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer">{label}</FormLabel>
                </FormItem>
            )}
        />
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SectionHeader({ title, form, readFields, writeFields }: { title: string; form: UseFormReturn<any>; readFields: string[]; writeFields: string[] }) {
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">{title}</h4>
                <div className="flex items-center gap-4">
                    {readFields.length > 0 && (
                        <GroupCheckbox form={form} fields={readFields} label="Semua Lihat" />
                    )}
                    {writeFields.length > 0 && (
                        <GroupCheckbox form={form} fields={writeFields} label="Semua Kelola" />
                    )}
                </div>
            </div>
            <Separator />
        </div>
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function GroupCheckbox({ form, fields, label, className }: { form: UseFormReturn<any>; fields: string[]; label: string; className?: string }) {
    // Watch fields to determine state
    const values = form.watch(fields);
    const allChecked = values.every((v: boolean) => v === true);
    const someChecked = values.some((v: boolean) => v === true);

    const handleCheckedChange = (checked: boolean) => {
        fields.forEach(field => {
            form.setValue(field, checked, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
        });
    };

    return (
        <div className="flex flex-row items-center space-x-2">
            <Checkbox
                checked={allChecked ? true : (someChecked ? "indeterminate" : false)}
                onCheckedChange={handleCheckedChange}
                id={`group-${label}-${fields[0]}`}
            />
            <label
                htmlFor={`group-${label}-${fields[0]}`}
                className={`text-xs cursor-pointer select-none ${className || "text-muted-foreground"}`}
            >
                {label}
            </label>
        </div>
    );
}
