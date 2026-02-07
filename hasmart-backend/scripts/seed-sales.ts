import path from "node:path";
import * as XLSX from "xlsx";
import axios from "axios";
import * as dotenv from "dotenv";

dotenv.config();

// Configuration
const BASE_URL = "http://localhost:9999/api";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "12345678";

// --- Types ---
interface ApiResponse<T> {
  data: T;
  metaData: {
    code: number;
    status: string;
    message: string;
  };
}

interface UserLoginResponse {
  accessToken: string;
}

interface Branch {
  id: number;
  name: string;
  code: string;
}

interface ItemVariant {
  id: number;
  unit: string;
  amount: number;
  sellPrice: number;
}

interface Item {
  id: number;
  code: string;
  name: string;
  masterItemVariants: ItemVariant[];
}

interface SalesItemPayload {
  masterItemVariantId: number;
  qty: number;
  discounts?: { percentage: number }[];
}

interface SalesPayload {
  branchId: number;
  notes?: string;
  memberCode?: string | null;
  cashReceived: number;
  items: SalesItemPayload[];
  paymentType: "CASH" | "DEBIT" | "QRIS";
}

// --- Excel Interfaces ---
export interface PenjualanDoc {
  penjualan: PenjualanEntry[];
}

export interface PenjualanEntry {
  nomor: string; // SL2601000045
  items: PenjualanItem[];
  summary?: PenjualanSummary;
}

export interface PenjualanItem {
  no: number;
  kode: string;
  nama: string;
  kts: number | null;
  sat: string;
  hargaPokok: number | null;
  hargaJual: number | null;
  diskon: number | null;
  laba: number | null;
  jumlah: number | null;
}

export interface PenjualanSummary {
  subTotal?: number | null;
  diskon?: number | null;
  total?: number | null;
}

// --- Excel Logic (Copied/Adapted) ---
function toText(v: unknown): string {
  if (v == null) return "";
  return String(v).trim();
}

function parseNumberSmart(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;

  let s = String(v).trim();
  if (s === "") return null;
  s = s.replace(/\s+/g, "");

  const hasComma = s.includes(",");
  const hasDot = s.includes(".");

  if (hasComma && hasDot) {
    const lastComma = s.lastIndexOf(",");
    const lastDot = s.lastIndexOf(".");
    if (lastDot > lastComma) {
      s = s.replace(/,/g, "");
    } else {
      s = s.replace(/\./g, "").replace(/,/g, ".");
    }
  } else if (hasComma && !hasDot) {
    if (/^\d{1,3}(,\d{3})+$/.test(s)) s = s.replace(/,/g, "");
    else s = s.replace(/,/g, ".");
  } else if (!hasComma && hasDot) {
    if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
  }

  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function isTransactionHeaderRow(row: string[]): boolean {
  const first = row[0] ?? "";
  const hasSL = /^SL\d+$/i.test(first);
  const hasTableHead =
    row.includes("No") &&
    row.includes("Kode") &&
    row.includes("Nama") &&
    row.includes("Kts") &&
    row.includes("Sat");
  return hasSL && hasTableHead;
}

function isItemRow(row: string[]): boolean {
  return /^\d+$/.test(row[0] ?? "");
}

function isSummaryRow(row: string[]): boolean {
  return (row[0] ?? "") === "Sub Total" && row.includes("Total");
}

function parseItemRow(row: string[]): PenjualanItem | null {
  const no = parseNumberSmart(row[0]);
  if (no == null) return null;

  const item: PenjualanItem = {
    no: Math.trunc(no),
    kode: toText(row[1]),
    nama: toText(row[2]),
    kts: parseNumberSmart(row[3]),
    sat: toText(row[4]),
    hargaPokok: parseNumberSmart(row[5]),
    hargaJual: parseNumberSmart(row[6]),
    diskon: parseNumberSmart(row[7]),
    laba: parseNumberSmart(row[8]),
    jumlah: parseNumberSmart(row[9]),
  };

  if (!item.kode && !item.nama) return null;
  return item;
}

function parseSummaryRow(row: string[]): PenjualanSummary {
  const summary: PenjualanSummary = {};
  summary.subTotal = parseNumberSmart(row[1]);
  summary.diskon = parseNumberSmart(row[3]);
  summary.total = parseNumberSmart(row[5]);
  return summary;
}

function readPenjualanXls(filePath: string): PenjualanDoc {
  const wb = XLSX.readFile(filePath, { raw: false });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) throw new Error("Excel tidak punya sheet.");

  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, {
    header: 1,
    raw: false,
    defval: "",
    blankrows: false,
  });

  const normalized: string[][] = rows.map((r) => (r as unknown[]).map(toText));
  const doc: PenjualanDoc = { penjualan: [] };
  let current: PenjualanEntry | null = null;

  for (let i = 1; i < normalized.length; i++) {
    const row = normalized[i];
    if (!row || row.every((c) => c === "")) continue;

    if (isTransactionHeaderRow(row)) {
      if (current) doc.penjualan.push(current);
      current = { nomor: toText(row[0]), items: [] };
      continue;
    }

    if (!current) continue;

    if (isSummaryRow(row)) {
      current.summary = parseSummaryRow(row);
      continue;
    }

    if (isItemRow(row)) {
      const item = parseItemRow(row);
      if (item) current.items.push(item);
      continue;
    }
  }

  if (current) doc.penjualan.push(current);
  return doc;
}

// --- API ---
const api = axios.create({ baseURL: BASE_URL });

async function login(): Promise<string> {
  try {
    const res = await api.post<ApiResponse<UserLoginResponse>>(
      "/app/user/login",
      {
        name: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      },
    );
    const token = res.data.data.accessToken;
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    console.log("Login successful.");
    return token;
  } catch (error: any) {
    console.error("Login failed:", error.response?.data || error.message);
    throw new Error("Could not login.");
  }
}

async function getFirstBranch(): Promise<Branch> {
  try {
    const res = await api.get<ApiResponse<Branch[]>>("/app/branch?limit=1");
    if (res.data.data && res.data.data.length > 0) {
      return res.data.data[0];
    }
    // Create default if not exists (should already exist from seed-item)
    const createRes = await api.post<ApiResponse<Branch>>("/app/branch", {
      code: "PUSAT",
      name: "Hasmart Utama",
      address: "Jl Raya Sruwen-Karanggede KM.10 Susukan,Semarang",
      phone: "081229706622",
    });
    return createRes.data.data;
  } catch (error: any) {
    console.error("Failed to get branch:", error.message);
    throw error;
  }
}

async function getAllItems(): Promise<Item[]> {
  try {
    // Determine total first or just fetch a large number
    // We'll fetch a large number for now, or loop pages if needed.
    // Assuming 1000 items from seed-item is enough, if > 1000 need pagination
    const res = await api.get<ApiResponse<{ rows: Item[] }>>(
      "/master/item?limit=2000",
    ); // Assuming structure returned by filter middleware
    // Note: getFirstBranch used ApiResponse<Branch[]> because branch controller uses sendList
    // Item controller uses generic getAll which typically returns { rows: [], pagination: {} }
    // Let's check item controller if possible, but safe guess based on other list endpoints is { rows }
    // Actually seed-purchase using direct access for suppliers? No, seed-purchase uses /master/supplier returns array?
    // Let's verify structure. `BaseController.sendList` sends plain array `data`.
    // `ItemController.getAllItems` calls `this.service.getAllItems` which returns `{ rows, pagination }`.
    // Then `sendList` wraps it? converting {rows, pagination} to just `rows`?
    // Wait, `BaseController` usually takes `[rows, count]` or result object.
    // Looking at `sales.controller.ts` -> `getAllSales` returns `{ rows, pagination }`.
    // `BaseController.sendList` implementation: `res.json({ data: result })` or handles aggregation?
    // Let's assume standard { rows } if pagination enabled.
    // If I use `sendList` with `{rows, pagination}`, the `data` field might be that object.
    // For safety, I'll allow flexible parsing.

    const data: any = res.data.data;
    if (Array.isArray(data)) return data;
    if (data.rows && Array.isArray(data.rows)) return data.rows;
    return [];
  } catch (error: any) {
    console.warn("Failed to fetch all items:", error.message);
    return [];
  }
}

async function createSales(payload: SalesPayload): Promise<any> {
  const res = await api.post<ApiResponse<any>>("/transaction/sales", payload);
  return res.data.data;
}

// --- Main ---

const xlsPath = path.resolve(process.cwd(), "scripts", "PENJUALAN.xls");

const seed = async () => {
  console.log("Starting Seed Sales (API Mode)...");

  // 1. Auth
  await login();

  // 2. Parse Excel
  console.log("Reading Excel...");
  const doc = readPenjualanXls(xlsPath);
  console.log(`Loaded transactions: ${doc.penjualan.length}`);

  if (doc.penjualan.length === 0) return;

  // 3. Master Data
  const branch = await getFirstBranch();
  console.log(`Using Branch: ${branch.name}`);

  console.log("Fetching Master Items...");
  const validItems = await getAllItems();
  console.log(`Fetched ${validItems.length} items from API.`);

  // Create Lookup Map: Code -> Item
  const itemMap = new Map<string, Item>();
  validItems.forEach((i) => {
    itemMap.set(i.code, i);
  });

  // 4. Process Transactions
  let successCount = 0;
  let failCount = 0;

  for (const entry of doc.penjualan) {
    try {
      // Calculation of expected total based on current prices (API Requirement)
      let expectedTotal = 0;

      if (entry.items.length === 0) {
        console.warn(`Skipping ${entry.nomor}: No items.`);
        continue;
      }

      // Map Items
      const salesItems: SalesItemPayload[] = [];
      for (const rawItem of entry.items) {
        const item = itemMap.get(rawItem.kode);
        if (!item) {
          console.warn(
            `Item not found: ${rawItem.kode} (${rawItem.nama}) in ${entry.nomor}`,
          );
          continue;
        }

        // Find variant by unit
        const variant = item.masterItemVariants.find(
          (v) => v.unit?.toLowerCase() === rawItem.sat?.toLowerCase(),
        );

        // Fallback: use first variant if unit matches nothing but only 1 variant exists
        const targetVariant =
          variant ||
          (item.masterItemVariants.length === 1
            ? item.masterItemVariants[0]
            : null);

        if (!targetVariant) {
          console.warn(
            `Variant not found for item ${item.code} unit ${rawItem.sat}`,
          );
          continue;
        }

        const qty = rawItem.kts || 1;

        // Accumulate expected total
        expectedTotal += Number(targetVariant.sellPrice) * qty;

        // Discount logic?
        // Excel has `diskon` (amount per item? or percent?).
        // `sales.validator` expects `discounts: { percentage }[]`.
        // If rawItem.diskon > 0, we need to calculate percentage relative to (hargaJual * qty) or simple price?
        // `diskon` in excel is usually line discount? or unit discount?
        // Let's assume it's unit discount amount for now, or total discount.
        // It's safer to omit discounts if we can't be sure, to avoid validation errors,
        // OR calculate: % = (diskon / (hargaJual * qty)) * 100.
        // Given complexity, let's omit discounts for initial refactor unless crucial.

        salesItems.push({
          masterItemVariantId: targetVariant.id,
          qty: qty,
          discounts: [], // Skipping discounts for simplicity in V1
        });
      }

      if (salesItems.length === 0) {
        console.warn(`Skipping ${entry.nomor}: No valid items mapped.`);
        continue;
      }

      // Use the calculated total to ensure "cashReceived >= total" check passes
      // We add a tiny buffer or just use exact match?
      // Exact match might fail due to floating point. Let's safe-guard?
      // API uses Decimal, likely safe if we pass number.
      // But just in case, let's use the calculated one.
      // If Excel summary.total is available, we ignore it because API enforces current price.

      const payload: SalesPayload = {
        branchId: branch.id,
        notes: `Original Invoice: ${entry.nomor}`,
        cashReceived: expectedTotal,
        paymentType: "CASH",
        items: salesItems,
      };

      await createSales(payload);
      console.log(
        `Created Sales: ${entry.nomor} -> TS-Success (Total: ${expectedTotal})`,
      );
      successCount++;
    } catch (e: any) {
      failCount++;
      console.error(
        `Failed ${entry.nomor}:`,
        e.response?.data?.errors || e.response?.data || e.message,
      );
    }
  }

  console.log(`\nSeed Sales Completed.`);
  console.log(`Success: ${successCount}`);
  console.log(`Failed: ${failCount}`);
};

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
