import React, { forwardRef } from 'react';
import styles from './receipt.module.css';
import { ReceiptData } from '@/types/report/receipt';


interface ReceiptProps {
    data: ReceiptData;
}


// --- HELPER ---
const formatCurrency = (val: string) => {
    return Number(val).toLocaleString('id-ID');
};

const formatQty = (val: number) => {
    return val.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// --- COMPONENT ---
export const Receipt = forwardRef<HTMLDivElement, ReceiptProps>(({ data }, ref) => {
    return (
        <div ref={ref} className={styles.receiptContainer}>
            {/* HEADER */}
            <div className={styles.header}>
                {/* <div className={styles.logoPlaceholder}>H</div> */}
                <img src="/logo.png" alt="Logo" className={styles.logo} />
                <div className={styles.storeName}>{data.storeName}</div>
                <div className={styles.address}>{data.address}</div>
                <div className={styles.address}>{data.phone}</div>
            </div>

            {/* METADATA (Tgl, No, Plg, Ksr - Vertical Stack) */}
            <div className={styles.metadata}>
                <div className={styles.metaRow}>
                    <span className={styles.metaLabel}>Tgl :</span>
                    <span className={styles.metaValue}>{data.transactionDate}</span>
                </div>
                <div className={styles.metaRow}>
                    <span className={styles.metaLabel}>No  :</span>
                    <span className={styles.metaValue}>{data.invoiceNumber}</span>
                </div>
                <div className={styles.metaRow}>
                    <span className={styles.metaLabel}>Plg :</span>
                    <span className={styles.metaValue}>{data.customerName}</span>
                </div>
                <div className={styles.metaRow}>
                    <span className={styles.metaLabel}>Ksr :</span>
                    <span className={styles.metaValue}>{data.cashierName}</span>
                </div>
            </div>

            {/* TABLE HEADER */}
            <div className={styles.tableHeader}>
                <div className={styles.colQty} style={{ textAlign: 'center' }}>Kts</div>
                <div className={styles.colPrice}>Harga</div>
                <div className={styles.colDisc}>Diskon</div>
                <div className={styles.colTotal}>Jumlah</div>
            </div>

            {/* ITEMS LIST */}
            <div>
                {data.items.map((item, index) => (
                    <div key={index} className={styles.itemRow}>
                        <div className={styles.itemName}>{item.name}</div>
                        <div className={styles.itemDetails}>
                            <div className={styles.colQty}>
                                {formatQty(item.qty)} {item.unit}
                            </div>
                            <div className={styles.colPrice}>
                                {formatCurrency(item.price)}
                            </div>
                            <div className={styles.colDisc}>
                                {formatCurrency(item.discount)}
                            </div>
                            <div className={styles.colTotal}>
                                {formatCurrency(item.total)}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* FOOTER TOTALS */}
            <div className={styles.totals}>
                <div className={styles.totalRow}>
                    <span>Sub Total</span>
                    <span>{formatCurrency(data.subTotal)}</span>
                </div>
                <div className={styles.totalRow}>
                    <span>Diskon</span>
                    <span>{formatCurrency(data.globalDiscount)}</span>
                </div>

                {/* Penambahan Pajak */}
                {data.showTax &&
                    <div className={styles.totalRow}>
                        <span>Pajak</span>
                        <span>{formatCurrency(data.tax)}</span>
                    </div>
                }

                <div className={`${styles.totalRow} ${styles.finalTotal}`}>
                    <span>Total</span>
                    <span>{formatCurrency(data.totalAmount)}</span>
                </div>

                <div className={styles.totalRow}>
                    <span>Bayar</span>
                    <span>{formatCurrency(data.payAmount)}</span>
                </div>
                <div className={styles.totalRow}>
                    <span>Kembali</span>
                    <span>{formatCurrency(data.changeAmount)}</span>
                </div>
            </div>

            {/* FOOTER MESSAGE */}
            <div className={styles.footerMessage}>
                <p>TERIMAKASIH TELAH BELANJA DI</p>
                <p>HaSMART ; )</p>
            </div>
        </div>
    );
});

Receipt.displayName = 'Receipt';