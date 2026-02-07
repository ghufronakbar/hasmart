# RefreshBuyPriceService Documentation

## 1. Overview

**RefreshBuyPriceService** adalah service yang bertanggung jawab untuk menjaga konsistensi data harga beli (`MasterItem.recordedBuyPrice`) dan profit per item variant dengan data historis transaksi.

Sistem ini menganut prinsip **Single Source of Truth** dari riwayat transaksi. Service ini tidak mengandalkan _increment/decrement_ sederhana, melainkan menghitung ulang total harga beli dari nol berdasarkan seluruh transaksi yang pernah terjadi untuk Item dan Cabang tertentu.

**Kapan service ini dipanggil?**
Service ini harus dieksekusi setiap kali ada proses `CREATE`, `UPDATE`, atau `DELETE` (Soft Delete) pada transaksi yang mempengaruhi Pembelian.
