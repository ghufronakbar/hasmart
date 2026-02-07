# Backup Restore Module

Module ini berfungsi untuk melakukan backup dan restore database PostgreSQL secara utuh menggunakan _native tools_ (`pg_dump` dan `pg_restore`). Format backup yang digunakan adalah **Custom Format** (`.dump`) yang efisien untuk data besar.

## Endpoints

### 1. Download Backup

**GET** `/backup`

- **Description**: Mengunduh file backup database saat ini.
- **Authentication**: (Saat ini dikomentari di code, accessible public/dev)
- **Response**: File download stream (`application/octet-stream`) dengan nama file `backup_TIMESTAMP.dump`.
- **Logic**:
  - Menggunakan `pg_dump` dengan format custom (`-Fc`).
  - File disimpan sementara di folder temp sistem sebelum di-stream ke client.
  - File temp otomatis dihapus setelah download selesai.

### 2. Restore Database

**POST** `/restore`

- **Description**: Merestore database dari file backup `.dump`. **Perhatian: Tindakan ini bersifat destruktif (menimpa database existing).**
- **Authentication**: Wajib menyertakan Header `Authorization: Bearer <token>`.
- **Body Request** (`multipart/form-data`):
  - `file`: File backup (`.dump`).
- **Validation**:
  - **File Existence**: File wajib diupload.
  - **Superuser Check**:
    - Jika database sudah memiliki user (`count > 0`), sistem akan memverifikasi token JWT dari header.
    - User **WAJIB** memiliki flag `isSuperUser = true` untuk melakukan restore.
    - Jika database masih kosong (first time setup), verifikasi ini di-skip.
- **Logic**:
  - File diupload ke temp storage.
  - Sistem mendeteksi versi PostgreSQL dan path tools (`pg_restore`, `psql`).
  - Menjalankan `pg_restore` dengan flag `--clean --if-exists --no-owner --no-privileges`.
  - **Fallback Mechanism**: Jika restore gagal karena isu kompatibilitas versi (misal: `transaction_timeout` dari PG16 ke PG15), sistem akan mencoba restore ulang dengan memfilter baris yang bermasalah menggunakan `pg_restore | filter | psql`.
  - **Post-Restore Action**:
    - Setelah restore berhasil, semua user dengan `isSuperUser: true` akan di-set menjadi:
      - Username: `admin`
      - Password: `12345678` (hashed)
      - Refresh Token: `null` (Force logout)
  - File temp dihapus setelah proses selesai.

## Technical Notes

- **Dependencies**: Membutuhkan binary `pg_dump`, `pg_restore`, dan `psql` yang terinstall di environment server/container dan versinya kompatibel dengan PostgreSQL server.
- **Config**: Path binary dapat di-override melalui environment variables (`PG_DUMP_BIN`, `PG_RESTORE_BIN`, `PSQL_BIN`).
