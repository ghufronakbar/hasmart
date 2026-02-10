# Report Module

Responsible for handling report generation requests.

## Authentication Note

Because these reports are often accessed via direct links or methods that might not easily attach an Authorization header (like simple `window.open` or anchor tags), the authentication middleware (`useAuth`) has been configured to accept `accessToken` from **query parameters** as well.

**Example:**
`?accessToken=your_jwt_token`

## Endpoints

All endpoints support the following query parameters:

| Parameter     | Type           | Required | Description                                             |
| :------------ | :------------- | :------- | :------------------------------------------------------ |
| `accessToken` | `string`       | **Yes**  | User's JWT Access Token for authentication.             |
| `exportAs`    | `string`       | **Yes**  | Format of the report. Values: `pdf`, `xlsx`, `preview`. |
| `branchId`    | `number`       | No       | Filter transactions by specific branch ID.              |
| `dateStart`   | `string` (ISO) | No       | Filter start date (e.g., `2024-01-01`).                 |
| `dateEnd`     | `string` (ISO) | No       | Filter end date (e.g., `2024-01-31`).                   |

### Response

- **Success (200)**: Returns a binary file stream (PDF or XLSX) with `Content-Disposition: attachment`.
- **Error (401)**: Unauthorized (Missing or invalid token).
- **Error (400)**: Invalid validation (e.g., missing `exportAs`).

---

### 1. Purchase Report (`Laporan Pembelian`)

Retrieves a list of purchase transactions.

- **URL**: `GET /report/purchase`
- **Example Request**:
  ```http
  GET /report/purchase?exportAs=pdf&accessToken=abc.123.xyz&dateStart=2024-01-01
  ```

### 2. Purchase Return Report (`Laporan Retur Pembelian`)

Retrieves a list of purchase return transactions.

- **URL**: `GET /report/purchase-return`
- **Example Request**:
  ```http
  GET /report/purchase-return?exportAs=xlsx&accessToken=abc.123.xyz
  ```

### 3. Sales Report (`Laporan Penjualan - Kasir`)

Retrieves a list of POS sales transactions.

- **URL**: `GET /report/sales`
- **Example Request**:
  ```http
  GET /report/sales?exportAs=pdf&accessToken=abc.123.xyz
  ```

### 4. Sales Return Report (`Laporan Retur Penjualan`)

Retrieves a list of sales return (POS) transactions.

- **URL**: `GET /report/sales-return`
- **Example Request**:
  ```http
  GET /report/sales-return?exportAs=pdf&accessToken=abc.123.xyz
  ```

### 5. Sell Report (`Laporan Penjualan - B2B`)

Retrieves a list of B2B sales transactions.

- **URL**: `GET /report/sell`
- **Example Request**:
  ```http
  GET /report/sell?exportAs=xlsx&accessToken=abc.123.xyz
  ```

### 6. Sell Return Report (`Laporan Retur Penjualan - B2B`)

Retrieves a list of B2B sales return transactions.

- **URL**: `GET /report/sell-return`
- **Example Request**:
  GET /report/sell-return?exportAs=pdf&accessToken=abc.123.xyz

  ```

  ```

### 7. Master Item Report (`Laporan Master Barang`)

Retrieves a list of items and their variants (Flat structure).

- **URL**: `GET /report/item`
- **Example Request**:
  ```http
  GET /report/item?exportAs=xlsx&accessToken=abc.123.xyz&branchId=1
  ```

### 8. Overall Report (`Laporan Keseluruhan`)

Retrieves aggregated daily report with per-user sales revenue, cashflow, payment-type breakdown, and profit.

- **URL**: `GET /report/overall`
- **Auth**: Required (Bearer Token or accessToken)
- **Query Params**:
  - `exportAs` (required): `pdf`, `xlsx`, or `preview`
  - `dateStart` (optional): Start date filter
  - `dateEnd` (optional): End date filter
  - `branchId` (optional): Filter by branch
- **Columns**:
  - `Tanggal` — Date
  - `Pendapatan {User}` — Per-user Sales revenue (dynamic, one column per user)
  - `Kas Masuk` — CashFlow IN
  - `Kas Keluar` — CashFlow OUT
  - `Pendapatan Tunai` — Sales CASH
  - `Pendapatan QRIS` — Sales QRIS
  - `Pendapatan Debit` — Sales DEBIT
  - `Pendapatan Penjualan` — Sell (B2B) revenue
  - `Total Laba Kotor` — Gross profit (Cash + QRIS + Debit + Sell)
  - `Total Laba Bersih` — Net profit (Gross - accumulated buy cost from items)
- **Example Request**:
  ```http
  GET /report/overall?exportAs=preview&accessToken=abc.123.xyz&dateStart=2026-01-01&dateEnd=2026-01-31
  ```
