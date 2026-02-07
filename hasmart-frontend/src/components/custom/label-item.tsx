import React, { forwardRef } from 'react';
import styles from './label-item.module.css';
import { LabelData } from '@/types/report/label';

interface LabelItemProps {
    data: LabelData[];
}

// --- HELPER ---
const formatCurrency = (val: string | number) => {
    // Pastikan val dikonversi ke number dulu jika string
    const num = typeof val === 'string' ? Number(val) : val;

    // Format: Rp3.050 (Tanpa spasi setelah Rp, sesuai gambar)
    // Menggunakan 'id-ID' standard
    return `Rp${num.toLocaleString('id-ID')}`;
};

// --- COMPONENT ---
export const LabelItem = forwardRef<HTMLDivElement, LabelItemProps>(({ data }, ref) => {
    return (
        <div ref={ref} className={styles.printContainer}>
            {/* LOOPING DATA (BULK PRINT)
                Kita render setiap item sebagai block terpisah 
            */}
            {data.map((item, index) => (
                <div
                    key={`${item.itemCode}-${index}`}
                    className={styles.labelBlock}
                    style={{ marginTop: index === 0 ? '10px' : undefined }}
                >

                    {/* BAGIAN ATAS: KODE ITEM */}
                    <div className={styles.itemCode}>
                        {item.itemCode}
                    </div>

                    {/* BAGIAN TENGAH: NAMA ITEM */}
                    <div className={styles.itemName}>
                        {item.itemName}
                    </div>

                    {/* BAGIAN BAWAH: VARIAN HARGA & UNIT */}
                    <div className={styles.variantsList}>
                        {item.variants.map((variant, vIndex) => (
                            <div key={vIndex} className={styles.variantRow}>
                                {/* Contoh: Rp3.050 / PCS */}
                                <span>{formatCurrency(variant.sellPrice)}</span>
                                <span>/</span>
                                <span className={styles.unitName}>{variant.unit}</span>
                            </div>
                        ))}
                    </div>

                </div>
            ))}

            {/* Fallback jika data kosong */}
            {data.length === 0 && (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                    Tidak ada data label untuk dicetak.
                </div>
            )}
        </div>
    );
});

LabelItem.displayName = 'LabelItem';