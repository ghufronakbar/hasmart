"use client";

import { useAccessControl, UserAccess } from "@/hooks/use-access-control";

export default function LedgerStockPage() {
    useAccessControl([UserAccess.accessLedgerStockRead], true);
    return <div>Ledger Stock</div>;
}