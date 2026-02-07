"use client";

import React, { useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useReactToPrint } from "react-to-print";
import { LabelItem } from "@/components/custom/label-item";
import { useLabel } from "@/hooks/report/use-label";
import { Button } from "@/components/ui/button";
import { useAccessControl, UserAccess } from "@/hooks/use-access-control";

export default function ReceiptPreviewPage() {
    useAccessControl([UserAccess.accessPrintLabelRead], true);
    const searchParams = useSearchParams();
    const masterItemIds = searchParams.get("id");
    const masterItemIdsNums = masterItemIds?.split(",").map((id) => Number(id));
    const onlyBaseUnitParams = searchParams.get("onlyBaseUnit");
    const onlyBaseUnit = onlyBaseUnitParams === "true";

    const { data: transaction, isLoading, error: salesError } = useLabel(masterItemIdsNums!, onlyBaseUnit);

    const componentRef = useRef<HTMLDivElement>(null);

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Cetak Label`,
    });

    if (!masterItemIds) return <div className="p-10">Mohon sertakan parameter ?id=...</div>;
    if (isLoading) return <div className="p-10">Loading Preview...</div>;
    if (salesError) return <div className="p-10 text-red-500">Error: {salesError.message}</div>;
    if (!transaction?.data) return <div className="p-10">Data Struk Tidak Ditemukan</div>;

    return (
        <div className="min-h-screen p-8 flex flex-col items-center gap-6">
            <div className="flex gap-4">
                <Button
                    onClick={handlePrint}
                >
                    🖨️ PRINT LABEL
                </Button>
            </div>

            <div className="text-sm text-gray-500 mb-2">
                Preview Tampilan (Lebar 58mm):
            </div>

            <div className="shadow-2xl border border-gray-200">
                {transaction && <LabelItem ref={componentRef} data={transaction.data} />}
            </div>
        </div>
    );
}