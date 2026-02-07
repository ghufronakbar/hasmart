import path from "node:path";
import * as XLSX from "xlsx";
import axios, { AxiosInstance } from "axios";
import * as dotenv from "dotenv";

dotenv.config();

// Configuration
const BASE_URL = "http://localhost:9999/api";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin"; // Using username "admin" as per previous script
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "12345678";

// Types matching backend responses
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
  refreshToken: string;
  user: {
    id: number;
    name: string;
    // ... other fields
  };
}

interface Branch {
  id: number;
  name: string;
  code: string;
}

interface Supplier {
  id: number;
  code: string;
  name: string;
}

interface ItemCategory {
  id: number;
  code: string;
  name: string;
}

interface ItemVariant {
  id: number;
  unit: string;
  amount: number;
  sellPrice: number;
  recordedBuyPrice: number;
  isBaseUnit: boolean;
}

interface Item {
  id: number;
  code: string;
  name: string;
  masterSupplierId: number;
  masterItemCategoryId: number;
  recordedBuyPrice: number;
  isActive: boolean;
  masterItemVariants: ItemVariant[];
  // Add relations for codes if the API returns them directly on the item object
  masterSupplier?: {
    code: string;
  };
  masterItemCategory?: {
    code: string;
  };
}

// Logic to help finding variants
interface VariantLookup {
  masterItemId: number;
  masterItemVariantId: number;
  purchasePrice: number;
}

// Excel Parsing Interfaces
export interface PembelianDoc {
  meta?: {
    app?: string; // "HaSmart"
    report?: string; // "PEMBELIAN"
    address?: string;
    phone?: string;
  };
  pembelian: PembelianEntry[];
}

export interface PembelianEntry {
  header: PembelianHeader;
  items: PembelianItem[];
  summary?: PembelianSummary;
}

export interface PembelianHeader {
  nomor?: string;
  admin?: string;
  tanggal?: string;
  pemasok?: string;
  jatuhTempo?: string;
  lokasi?: string;
}

export interface PembelianItem {
  no: number;
  kode: string;
  nama: string;
  kuantitas: number | null;
  sat: string;
  hargaBeli: number | null;
  diskon: number | null;
  discounts?: number | null;
  jumlah: number | null;
}

export interface PembelianSummary {
  keterangan?: string | null;
  subTotal?: number | null;
  diskon?: number | null;
  total?: number | null;
}

// Helper Functions for Parsing
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

function parseDateDDMMYYYY(v: unknown): string | undefined {
  const s = toText(v);
  if (!s) return undefined;

  const m = s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
  if (!m) return undefined;

  const dd = Number(m[1]);
  const mm = Number(m[2]);
  const yyyy = Number(m[3]);
  if (dd < 1 || dd > 31 || mm < 1 || mm > 12) return undefined;

  return `${yyyy.toString().padStart(4, "0")}-${mm
    .toString()
    .padStart(2, "0")}-${dd.toString().padStart(2, "0")}`;
}

function isLikelyPurchaseHeaderRow(row: string[]): boolean {
  const hasNomor = row.some((c) => c === "Nomor");
  const hasColon = row.includes(":");
  const hasTableHead =
    row.includes("No") && row.includes("Kode") && row.includes("Nama");
  return hasNomor && hasColon && hasTableHead;
}

function isItemRow(row: string[]): boolean {
  const c0 = row[0] ?? "";
  return /^\d+$/.test(c0);
}

function isSummaryRow(row: string[]): boolean {
  return row.some((c) => c === "Keterangan") && row.some((c) => c === "Total");
}

function parseHeaderRow(row: string[]): PembelianHeader {
  const header: PembelianHeader = {};
  const labels = new Set([
    "Nomor",
    "Admin",
    "Tanggal",
    "Pemasok",
    "Jatuh Tempo",
  ]);
  for (let i = 0; i < row.length; i++) {
    const cell = row[i];
    if (!labels.has(cell)) continue;

    const colon = row[i + 1];
    const val = row[i + 2];

    if (colon !== ":") continue;

    if (cell === "Nomor") header.nomor = toText(val) || undefined;
    if (cell === "Admin") header.admin = toText(val) || undefined;
    if (cell === "Tanggal") header.tanggal = parseDateDDMMYYYY(val);
    if (cell === "Pemasok") header.pemasok = toText(val) || undefined;
    if (cell === "Jatuh Tempo") header.jatuhTempo = parseDateDDMMYYYY(val);
  }

  const noIdx = row.findIndex((c) => c === "No");
  if (noIdx > 0) {
    const candidate = toText(row[noIdx - 1]);
    if (candidate && candidate !== ":" && !labels.has(candidate)) {
      header.lokasi = candidate;
    }
  }

  return header;
}

function parseItemRow(row: string[]): PembelianItem | null {
  // No | Kode | Nama | Kuantitas | Sat | Harga Beli | Diskon | Jumlah
  const no = parseNumberSmart(row[0]);
  if (no == null) return null;

  const item: PembelianItem = {
    no: Math.trunc(no),
    kode: toText(row[1]),
    nama: toText(row[2]),
    kuantitas: parseNumberSmart(row[3]),
    sat: toText(row[4]),
    hargaBeli: parseNumberSmart(row[5]),
    diskon: parseNumberSmart(row[6]),
    jumlah: parseNumberSmart(row[7]),
  };

  if (!item.kode && !item.nama) return null;

  return item;
}

function parseSummaryRow(row: string[]): PembelianSummary {
  const summary: PembelianSummary = {};
  for (let i = 0; i < row.length; i++) {
    const cell = row[i];

    if (cell === "Keterangan" && row[i + 1] === ":") {
      const ket = toText(row[i + 2]);
      summary.keterangan = ket === "" ? null : ket;
    }
    if (cell === "Sub Total" && row[i + 1] === ":") {
      summary.subTotal = parseNumberSmart(row[i + 2]);
    }
    if (cell === "Diskon" && row[i + 1] === ":") {
      summary.diskon = parseNumberSmart(row[i + 2]);
    }
    if (cell === "Total" && row[i + 1] === ":") {
      summary.total = parseNumberSmart(row[i + 2]);
    }
  }
  return summary;
}

function readPembelianXls(filePath: string): PembelianDoc {
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

  const doc: PembelianDoc = { pembelian: [] };
  const normalized: string[][] = rows.map((r) => (r as unknown[]).map(toText));

  if (normalized.length > 0) {
    const r0 = normalized[0];
    const anyMeta = r0.some((x) => x !== "");
    if (anyMeta) {
      doc.meta = {
        app: r0[0] || undefined,
        report: r0[1] || undefined,
        address: r0[2] || undefined,
        phone: r0[3] || undefined,
      };
    }
  }

  let current: PembelianEntry | null = null;

  for (let i = 1; i < normalized.length; i++) {
    const row = normalized[i];
    if (!row || row.every((c) => c === "")) continue;

    if (isLikelyPurchaseHeaderRow(row)) {
      if (current) doc.pembelian.push(current);
      current = {
        header: parseHeaderRow(row),
        items: [],
      };
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

  if (current) doc.pembelian.push(current);

  return doc;
}

// ====== API WRAPPERS ======

const api = axios.create({
  baseURL: BASE_URL,
});

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
    if (error.response) {
      console.error(
        "Login failed response:",
        error.response.status,
        error.response.data,
      );
    } else {
      console.error("Login failed:", error.message);
    }
    throw new Error(
      "Could not login. Ensure API is running and admin user exists.",
    );
  }
}

async function getFirstBranch(): Promise<Branch> {
  try {
    const res = await api.get<ApiResponse<Branch[]>>("/app/branch?limit=1");
    if (res.data.data.length > 0) {
      return res.data.data[0];
    }
    // Create Default
    console.log("No branches found. Creating default 'Pusat' branch...");
    const createRes = await api.post<ApiResponse<Branch>>("/app/branch", {
      code: "PUSAT",
      name: "Pusat",
      address: "Salatiga",
      phone: "08123456789",
    });
    return createRes.data.data;
  } catch (error: any) {
    console.error("Failed to get/create branch:", error.message);
    throw error;
  }
}

async function getSuppliers(): Promise<Supplier[]> {
  try {
    const res = await api.get<ApiResponse<Supplier[]>>(
      "/master/supplier?limit=1000",
    );
    return res.data.data;
  } catch (error) {
    console.error("Failed to fetch suppliers");
    return [];
  }
}

async function createSupplier(name: string, code: string): Promise<Supplier> {
  const res = await api.post<ApiResponse<Supplier>>("/master/supplier", {
    code,
    name,
  });
  return res.data.data;
}

async function getDefaultCategory(): Promise<ItemCategory> {
  const res = await api.get<ApiResponse<ItemCategory[]>>(
    "/master/item-category?limit=1",
  );
  if (res.data.data.length === 0) {
    // Create if needed or throw
    throw new Error(
      "No Item Category found. Please create one manually first.",
    );
  }
  return res.data.data[0];
}

async function getItemByCode(code: string): Promise<Item | null> {
  try {
    // Requires exact code match usually
    const res = await api.get<ApiResponse<Item>>(`/master/item/code/${code}`);
    return res.data.data;
  } catch (error: any) {
    if (error.response?.status === 404) return null;
    throw error;
  }
}
async function getAllItems(): Promise<Item[]> {
  try {
    // Fetch all items to build initial map. Warning: Optimization needed for large datasets.
    const res = await api.get<ApiResponse<Item[]>>("/master/item?limit=2000"); // Adjust limit as needed
    return res.data.data;
  } catch (e: any) {
    console.error("Failed to fetch items", e.message);
    return [];
  }
}

async function createItem(payload: any): Promise<Item> {
  const res = await api.post<ApiResponse<Item>>("/master/item", payload);
  return res.data.data;
}

async function updateItem(id: number, payload: any): Promise<Item> {
  const res = await api.put<ApiResponse<Item>>(`/master/item/${id}`, payload);
  return res.data.data;
}

// ====== MAIN SCRIPT ======

const xlsPath = path.resolve(process.cwd(), "scripts", "PEMBELIAN.xls");

const seed = async () => {
  console.log(`Starting Seed Purchase (API Mode)...`);

  // 1. Auth
  await login();

  // 2. Load Metadata
  const branch = await getFirstBranch();
  console.log(`Using Branch: ${branch.name}`);

  const defaultCategory = await getDefaultCategory();
  console.log(`Using Default Category: ${defaultCategory.name}`);

  let suppliers = await getSuppliers();
  console.log(`Loaded ${suppliers.length} suppliers.`);

  // Initial fetch of items to populate cache can be heavy, but let's try or just fetch on demand?
  // "Fetch on demand" with cache is safer if we assume items might be missing.
  // However, checking existence by code is fast.

  // We will maintain a local cache of items to avoid re-fetching the same item in the loop
  const itemCache = new Map<string, Item>();

  // Helper to get item (from cache or API)
  const getOrFetchItem = async (code: string): Promise<Item | null> => {
    if (itemCache.has(code)) return itemCache.get(code)!;
    const item = await getItemByCode(code);
    if (item) itemCache.set(code, item);
    return item;
  };

  const pembelianJson: PembelianDoc = readPembelianXls(xlsPath);
  console.log(`Found ${pembelianJson.pembelian.length} transactions in Excel.`);

  const SUPPLIER_MAP: Record<string, string> = {
    INDOMARCO: "IDM",
    MAYORA: "MYR",
    SOLO: "SL",
    WINGS: "WGS",
    DIPLOMAT: "DPL",
    "COCA COLA": "CCL",
    SURUH: "SRH",
    UNILEVER: "UNN",
    MALANG: "ML",
    UMUM: "UMM",
    "LUWAK COFFE": "LWK",
    CIMORY: "CMR",
    DJARUM: "DRM",
    ARTABOGA: "ATB",
    PELANGI: "PLG",
    DANDANG: "DDG",
    SALATIGA: "SL3",
  };

  // Process Purchases
  for (const purc of pembelianJson.pembelian) {
    const { header, items, summary } = purc;
    const { nomor, tanggal, pemasok, jatuhTempo } = header;

    console.log(
      `Processing Invoice: ${nomor} (${pembelianJson.pembelian.indexOf(purc) + 1}/${pembelianJson.pembelian.length})`,
    );

    // --- Supplier Handling ---
    let supplierCode = "";
    if (pemasok && SUPPLIER_MAP[pemasok.toUpperCase()]) {
      supplierCode = SUPPLIER_MAP[pemasok.toUpperCase()];
    }

    let supplier = suppliers.find(
      (s) =>
        s.code === supplierCode ||
        s.name.toLowerCase() === pemasok?.toLowerCase(),
    );

    if (!supplier) {
      if (pemasok) {
        console.log(`Creating missing supplier: ${pemasok}`);
        try {
          supplier = await createSupplier(
            pemasok,
            supplierCode || pemasok.substring(0, 5).toUpperCase(),
          );
          suppliers.push(supplier);
        } catch (e: any) {
          console.error(`Failed to create supplier ${pemasok}:`, e.message);
          continue;
        }
      } else {
        console.warn(`Skipping ${nomor}: Supplier name missing`);
        continue;
      }
    }

    // --- Items Handling ---
    const purchaseItems: any[] = [];

    for (const itemRow of items) {
      const itemCode = itemRow.kode.trim().toUpperCase();
      const itemUnit = itemRow.sat.trim().toUpperCase();

      try {
        // 1. Check if Item Exists
        let masterItem = await getOrFetchItem(itemCode);

        if (!masterItem) {
          // Create New Item
          console.log(`Creating new item: ${itemRow.nama} (${itemCode})`);
          const newItemPayload = {
            name: itemRow.nama,
            code: itemCode,
            masterSupplierCode: supplier.code,
            masterItemCategoryCode: defaultCategory.code,
            isActive: true,
            masterItemVariants: [
              {
                unit: itemUnit,
                amount: 1, // Assumption: Base unit
                sellPrice: 0,
              },
            ],
          };
          masterItem = await createItem(newItemPayload);
          itemCache.set(itemCode, masterItem);
        }

        // 2. Check if Variant Exists
        let variant = masterItem.masterItemVariants.find(
          (v) => v.unit.toUpperCase() === itemUnit,
        );

        if (!variant) {
          // Add Variant to existing Item
          console.log(`Adding variant ${itemUnit} to item ${itemCode}`);

          // We need to construct the update payload which includes existing variants + new one
          // The API expects 'masterItemVariants' array with actions or full list?
          // Checking ItemUpdateBodySchema: it expects array of variants.
          // Validator logic:
          // - action: "create" | "update" | "delete"
          // - if update/delete, need id. if create, no id.

          const updatePayloadVars = masterItem.masterItemVariants.map((v) => ({
            id: v.id,
            unit: v.unit,
            amount: v.amount,
            sellPrice: v.sellPrice,
            action: "update",
          }));

          updatePayloadVars.push({
            id: undefined as any, // ID is not sent for 'create' action
            unit: itemUnit,
            amount: 1, // Defaulting to 1 if we don't know relation
            sellPrice: 0,
            action: "create",
          });

          // Re-fetch item to get its current supplier/category codes if not already present in `masterItem`
          const itemFull = await getItemByCode(itemCode);
          if (!itemFull) {
            console.error(
              `  -> Failed to re-fetch item ${itemCode} for variant update.`,
            );
            continue;
          }

          const itemSupplierCode =
            itemFull.masterSupplier?.code || supplier.code; // Fallback to current purchase supplier
          const itemCategoryCode =
            itemFull.masterItemCategory?.code || defaultCategory.code; // Fallback to default category

          const safePayload = {
            name: itemFull.name,
            masterSupplierCode: itemSupplierCode,
            masterItemCategoryCode: itemCategoryCode,
            isActive: itemFull.isActive, // Keep existing active status
            buyPrice: itemFull.recordedBuyPrice, // Keep existing buy price
            masterItemVariants: updatePayloadVars,
          };

          const updatedItem = await updateItem(masterItem.id, safePayload);
          masterItem = updatedItem; // Update reference
          itemCache.set(itemCode, masterItem); // Update cache

          variant = masterItem.masterItemVariants.find(
            (v) => v.unit.toUpperCase() === itemUnit,
          );
        }

        if (variant) {
          purchaseItems.push({
            masterItemVariantId: variant.id,
            qty: itemRow.kuantitas || 0,
            purchasePrice: itemRow.hargaBeli || 0,
            discounts: itemRow.discounts
              ? [{ percentage: itemRow.discounts }]
              : [],
          });
        }
      } catch (err: any) {
        console.error(
          `Error processing item ${itemCode}:`,
          err.response?.data || err.message,
        );
      }
    }

    if (purchaseItems.length === 0) {
      console.warn(`Skipping ${nomor}: No valid items`);
      continue;
    }

    // --- Create Transaction ---
    const payload = {
      invoiceNumber: nomor || `INV-${Date.now()}`,
      transactionDate: new Date(tanggal || new Date()),
      dueDate: new Date(jatuhTempo || new Date()),
      masterSupplierCode: supplier.code,
      branchId: branch.id,
      notes: summary?.keterangan || "",
      taxPercentage: 0,
      items: purchaseItems,
    };

    try {
      const response = await api.post("/transaction/purchase", payload);
      console.log(`Success: ${nomor} -> ID: ${response.data.data.id}`);
    } catch (error: any) {
      console.error(`Failed to create transaction ${nomor}:`);
      if (axios.isAxiosError(error)) {
        console.error(JSON.stringify(error.response?.data, null, 2));
      } else {
        console.error(error.message);
      }
    }
  }
};

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
