"use client";

import React, { useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useReactToPrint } from "react-to-print";
import { Receipt } from "@/components/custom/receipt";
import { useReceipt } from "@/hooks/report/use-receipt";
import { Button } from "@/components/ui/button";

export default function ReceiptPreviewPage() {
    const searchParams = useSearchParams();
    const transactionId = searchParams.get("id");
    const type = searchParams.get("type");

    const { data: transaction, isLoading, error: salesError } = useReceipt(type!, transactionId!);

    const componentRef = useRef<HTMLDivElement>(null);

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Struk-${transactionId}`,
    });

    if (!transactionId) return <div className="p-10">Mohon sertakan parameter ?id=...</div>;
    if (!type) return <div className="p-10">Mohon sertakan parameter ?type=...</div>;
    if (isLoading) return <div className="p-10">Loading Preview...</div>;
    if (salesError) return <div className="p-10 text-red-500">Error: {salesError.message}</div>;
    if (!transaction?.data) return <div className="p-10">Data Struk Tidak Ditemukan</div>;

    return (
        <div className="min-h-screen p-8 flex flex-col items-center gap-6">
            <div className="flex gap-4">
                <Button
                    onClick={handlePrint}
                >
                    🖨️ PRINT STRUK
                </Button>
            </div>

            <div className="text-sm text-gray-500 mb-2">
                Preview Tampilan (Lebar 58mm):
            </div>

            <div className="shadow-2xl border border-gray-200">
                {transaction && <Receipt ref={componentRef} data={transaction.data} />}
            </div>
        </div>
    );
}