# Internal System for Point of Sales and Inventory Management

## Techstack

- **Frontend:** Next.js (Typescript)
- **Backend:** Node.js/Express.js (Typescript)
- **Database:** PostgreSQL/Prisma
- **Validation:** Zod

## Architecture

- **Deployment:** Container-based (Docker).
- **Topology:**
  - One **Backend Server/Container** (Back Office) running the core application and database.
  - Multiple **Frontend Clients** (POS/Cashier stations) accessing the backend via local network.
- **Remote Access:** Tunneling is used to allow administrators to monitor the Back Office from outside the local network.

## Business Core Concepts

### 1. Multi-Branch System

- The system is designed to handle multiple branches (outlets).
- Each **Branch** has its own:
  - **Stock Inventory** (`ItemBranch`).
  - **Transaction History**.
  - **Reports**.
- Stock transfers between branches are supported (`TransactionTransfer`).

### 2. Flexible Access Control

- Instead of rigid roles (e.g., "Cashier", "Manager"), the system uses **Flexible Access Rights**.
- **Superuser** has full access.
- **User Management** handles authentication (JWT) and setup.

### 3. Hardware Integration

- **Printers:** Supports Receipt (58mm), Label/Barcode, and Report printers.
- **Scanners:** Barcode scanner integration for item lookup.

---

## Module Breakdown

### A. App Modules

| Module     | Description              | Key Features                                             |
| :--------- | :----------------------- | :------------------------------------------------------- |
| **Branch** | Manage outlet locations. | Code unique, soft delete, receipt printer config.        |
| **User**   | Authentication & Authz.  | First-time setup, Login, JWT, Password hashing (bcrypt). |

### B. Master Data Modules

| Module              | Description           | Key Business Rules                                        |
| :------------------ | :-------------------- | :-------------------------------------------------------- |
| **Item**            | Product Management.   | Nested **Variants** (Units), Branch-specific stock query. |
| **Item Category**   | Product grouping.     | Restore on create if deleted.                             |
| **Member**          | Customer database.    | Used in Sales/Sell.                                       |
| **Member Category** | Customer grouping.    | e.g., VIP, Regular.                                       |
| **Supplier**        | Vendors/Distributors. | Used in Purchase actions.                                 |
| **Unit**            | Measurement units.    | e.g., PCS, BOX, PACK.                                     |

### C. Transaction Modules

#### 1. Inventory Management

- **Adjust Stock (Stock Opname):**
  - Input **Actual Qty**, system calculates **Gap** (Actual - Recorded).
  - Immutable adjustment records.
  - Auto-calculation of surplus (`+`) or shortage (`-`).
- **Transfer:**
  - Move stock between branches (`fromId` -> `toId`).
  - Updates stock in both sender and receiver branches.
  - No financial impact recorded, only physical quantity.

#### 2. Procurement (Inbound)

- **Purchase:**
  - Buying from Suppliers.
  - Features: Cascading Discounts, Tax (if any).
  - Increases Stock.
- **Purchase Return:**
  - Returning items to Suppliers.
  - Decreases Stock.

#### 3. Retail Sales (POS - Outbound)

- **Sales:**
  - **Target:** Walk-in customers / End users.
  - **Features:** Auto-generated Invoice (`TS-...`), Optional Member, No Due Date.
  - Decreases Stock.
- **Sales Return:**
  - Customer returns.
  - **Requirement:** Must reference original `Sales` invoice.
  - Increases Stock.

#### 4. Wholesale (B2B - Outbound)

- **Sell:**
  - **Target:** Registered Members (B2B/Grosir).
  - **Features:** Auto-generated Invoice (`INV-...`), **Mandatory Member**, **Due Date** (Terms), **Tax Calculation** (PPN).
  - Decreases Stock.
- **Sell Return:**
  - B2B Member returns.
  - **Features:** Auto-generated Return Number (`RTG-...`), Tax Refund calculation.
  - Increases Stock.

---

## Technical & Business Rules Summary

1.  **Stock Refresh:**
    - All transactions trigger a `RefreshStockService` to ensure real-time accuracy of `ItemBranch` stock.
2.  **Soft Deletes:**
    - Most entities support soft delete (`deletedAt`).
    - Unique constraints typically apply to _active_ records only.
    - "Create" operations often restore soft-deleted records if codes match to prevent duplicates.
3.  **Variant System:**
    - Items have multiple variants (e.g., PCS vs BOX).
    - Transactions use `recordedConversion` to standardize quantities to the Base Unit for stock tracking.
4.  **Audit Trail:**
    - All critical actions (Create/Update/Delete) are logged in `RecordAction`.
