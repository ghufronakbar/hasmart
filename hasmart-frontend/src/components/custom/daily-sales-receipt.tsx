import React, { forwardRef } from 'react';
import styles from './daily-sales-receipt.module.css';

// Inteface matches backend SalesReceipt
interface DailySalesReceiptData {
    branch: {
        name: string;
        phone?: string | null;
        address?: string | null;
    };
    date: string; // ISO String from JSON
    cashierName: string;
    totalTransaction: number;
    totalAmount: string;
    totalReturn: string;
    cashFlowIn: string;
    cashFlowOut: string;
    paymentType: {
        CASH: string;
        DEBIT: string;
        QRIS: string;
    };
    cashIncome: string;
    balance: string;
}

interface DailySalesReceiptProps {
    data: DailySalesReceiptData;
}

const formatCurrency = (val: string | number) => {
    return Number(val).toLocaleString('id-ID');
};

const formatDate = (dateStr: string) => {
    try {
        return new Date(dateStr).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    } catch {
        return dateStr;
    }
};

export const DailySalesReceipt = forwardRef<HTMLDivElement, DailySalesReceiptProps>(({ data }, ref) => {
    return (
        <div ref={ref} className={styles.receiptContainer}>
            {/* HEADER */}
            <div className={styles.header}>
                <img src="/logo.png" alt="Logo" className={styles.logo} />
                <div className={styles.storeName}>{data.branch.name}</div>
                <div className={styles.address}>{data.branch.address}</div>
                <div className={styles.address}>{data.branch.phone}</div>
            </div>

            <div className={styles.title}>LAPORAN HARIAN</div>

            {/* METADATA */}
            <div className={styles.metadata}>
                <div className={styles.metaRow}>
                    <span className={styles.metaLabel}>Tgl  :</span>
                    <span className={styles.metaValue}>{formatDate(data.date)}</span>
                </div>
                <div className={styles.metaRow}>
                    <span className={styles.metaLabel}>Ksr  :</span>
                    <span className={styles.metaValue}>{data.cashierName}</span>
                </div>
            </div>

            {/* SUMMARY */}
            <div className={styles.section}>
                <div className={styles.row}>
                    <span>Total Trx</span>
                    <span>{data.totalTransaction}</span>
                </div>
                <div className={styles.row}>
                    <span>Total Omset</span>
                    <span>{formatCurrency(data.totalAmount)}</span>
                </div>
                <div className={styles.row}>
                    <span>Total Retur</span>
                    <span>{formatCurrency(data.totalReturn)}</span>
                </div>
                <div className={styles.row}>
                    <span>Kas Masuk</span>
                    <span>{formatCurrency(data.cashFlowIn)}</span>
                </div>
                <div className={styles.row}>
                    <span>Kas Keluar</span>
                    <span>{formatCurrency(data.cashFlowOut)}</span>
                </div>
                <div className={styles.totalRow}>
                    <span>Net Sales</span>
                    <span>{formatCurrency(Number(data.totalAmount) - Number(data.totalReturn))}</span>
                </div>
            </div>

            {/* PAYMENT TYPE */}
            <div className={styles.section}>
                <div className={styles.row}>
                    <span>CASH</span>
                    <span>{formatCurrency(data.paymentType.CASH)}</span>
                </div>
                <div className={styles.row}>
                    <span>DEBIT</span>
                    <span>{formatCurrency(data.paymentType.DEBIT)}</span>
                </div>
                <div className={styles.row}>
                    <span>QRIS</span>
                    <span>{formatCurrency(data.paymentType.QRIS)}</span>
                </div>
            </div>

            {/* CASH BALANCE */}
            <div className={styles.section}>
                <div className={styles.row}>
                    <span>Uang Fisik (Cash)</span>
                    <span>{formatCurrency(data.cashIncome)}</span>
                </div>
                <div className={styles.row}>
                    <span>Keluar (Retur)</span>
                    <span>({formatCurrency(data.totalReturn)})</span>
                </div>
                <div className={styles.totalRow}>
                    <span>Setoran</span>
                    <span>{formatCurrency(data.balance)}</span>
                </div>
            </div>

            {/* FOOTER MESSAGE */}
            <div className={styles.footerMessage}>
                <p>-- END OF REPORT --</p>
                <p>{new Date().toLocaleString('id-ID')}</p>
            </div>
        </div>
    );
});

DailySalesReceipt.displayName = 'DailySalesReceipt';
