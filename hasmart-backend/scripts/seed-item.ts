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

interface Unit {
  id: number;
  unit: string;
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
  masterSupplier?: { code: string };
  masterItemCategory?: { code: string };
}

// --- Excel Interface ---
export interface ItemSeed {
  kodeItem: string;
  namaItem: string;
  kodeJenis: string;
  kodePemasok: string;

  hargaBeli: number | null;
  hargaPokok: number | null;

  satuan1: string;
  satuan2?: string | null;

  kuantitas1: number | null;
  kuantitas2?: number | null;

  hargaJualEcer1: number | null;
  hargaJualEcer2?: number | null;

  hargaJualGrosir1: number | null;
  hargaJualGrosir2?: number | null;

  hargaJualKhusus1: number | null;
  hargaJualKhusus2?: number | null;

  stok: number | null;
  upload: string;
  tipe: string;
}

const COL_MAP: Record<string, keyof ItemSeed> = {
  KodeItem: "kodeItem",
  NamaItem: "namaItem",
  KodeJenis: "kodeJenis",
  KodePemasok: "kodePemasok",
  HargaBeli: "hargaBeli",
  HargaPokok: "hargaPokok",
  Satuan1: "satuan1",
  Satuan2: "satuan2",
  Kuantitas1: "kuantitas1",
  Kuantitas2: "kuantitas2",
  HargaJualEcer1: "hargaJualEcer1",
  HargaJualEcer2: "hargaJualEcer2",
  HargaJualGrosir1: "hargaJualGrosir1",
  HargaJualGrosir2: "hargaJualGrosir2",
  HargaJualKhusus1: "hargaJualKhusus1",
  HargaJualKhusus2: "hargaJualKhusus2",
  Stok: "stok",
  Upload: "upload",
  Tipe: "tipe",
};

const NUM_FIELDS = new Set<keyof ItemSeed>([
  "hargaBeli",
  "hargaPokok",
  "kuantitas1",
  "kuantitas2",
  "hargaJualEcer1",
  "hargaJualEcer2",
  "hargaJualGrosir1",
  "hargaJualGrosir2",
  "hargaJualKhusus1",
  "hargaJualKhusus2",
  "stok",
]);

// --- Parsing Helpers ---
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
    if (/^\d{1,3}(,\d{3})+$/.test(s)) {
      s = s.replace(/,/g, "");
    } else {
      s = s.replace(/,/g, ".");
    }
  } else if (!hasComma && hasDot) {
    if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
      s = s.replace(/\./g, "");
    }
  }

  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function readXlsAsItems(filePath: string): ItemSeed[] {
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

  if (rows.length < 2) return [];

  const headers = (rows[0] as unknown[]).map((h) => toText(h));
  const items: ItemSeed[] = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r] as unknown[];
    if (!row || row.length === 0) continue;

    const obj: Partial<ItemSeed> = {};

    for (let c = 0; c < headers.length; c++) {
      const h = headers[c];
      const key = COL_MAP[h];
      if (!key) continue;

      const cell = row[c];
      if (NUM_FIELDS.has(key)) {
        (obj as any)[key] = parseNumberSmart(cell);
      } else {
        (obj as any)[key] = toText(cell);
      }
    }

    const kodeItem = (obj.kodeItem ?? "").trim();
    const namaItem = (obj.namaItem ?? "").trim();
    if (!kodeItem && !namaItem) continue;

    // Normalize
    const satuan2 = (obj.satuan2 ?? "").trim();
    obj.satuan2 = satuan2 === "" ? null : satuan2;
    obj.kodeJenis = (obj.kodeJenis ?? "").trim();
    obj.kodePemasok = (obj.kodePemasok ?? "").trim();
    obj.satuan1 = (obj.satuan1 ?? "").trim();

    if (!kodeItem) throw new Error(`Row ${r + 1}: KodeItem kosong`);
    if (!namaItem)
      throw new Error(`Row ${r + 1}: NamaItem kosong (KodeItem=${kodeItem})`);

    items.push(obj as ItemSeed);
  }

  return items;
}

// --- API ---
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
    if (res.data.data && res.data.data.length > 0) {
      return res.data.data[0];
    }
    console.log("Creating default 'Pusat' branch...");
    const createRes = await api.post<ApiResponse<Branch>>("/app/branch", {
      code: "PUSAT",
      name: "Hasmart Utama", // Matching original script name
      address: "Jl Raya Sruwen-Karanggede KM.10 Susukan,Semarang",
      phone: "081229706622",
    });
    return createRes.data.data;
  } catch (error: any) {
    console.error("Failed to get/create branch:", error.message);
    throw error;
  }
}

async function getAllSuppliers(): Promise<Supplier[]> {
  try {
    const res = await api.get<ApiResponse<Supplier[]>>(
      "/master/supplier?limit=1000",
    );
    return res.data.data || [];
  } catch {
    return [];
  }
}

async function createSupplier(code: string, name: string): Promise<Supplier> {
  const res = await api.post<ApiResponse<Supplier>>("/master/supplier", {
    code,
    name,
  });
  return res.data.data;
}

async function getAllUnits(): Promise<Unit[]> {
  try {
    const res = await api.get<ApiResponse<Unit[]>>("/master/unit?limit=1000");
    return res.data.data || [];
  } catch {
    return [];
  }
}

async function createUnit(unitName: string): Promise<Unit> {
  const res = await api.post<ApiResponse<Unit>>("/master/unit", {
    unit: unitName,
    name: unitName,
  });
  return res.data.data;
}

async function getAllCategories(): Promise<ItemCategory[]> {
  try {
    const res = await api.get<ApiResponse<ItemCategory[]>>(
      "/master/item-category?limit=1000",
    );
    return res.data.data || [];
  } catch {
    return [];
  }
}

async function createCategory(
  code: string,
  name: string,
): Promise<ItemCategory> {
  const res = await api.post<ApiResponse<ItemCategory>>(
    "/master/item-category",
    { code, name },
  );
  return res.data.data;
}

async function getItemByCode(code: string): Promise<Item | null> {
  try {
    const res = await api.get<ApiResponse<Item>>(`/master/item/code/${code}`);
    return res.data.data;
  } catch (error: any) {
    if (error.response?.status === 404) return null;
    throw error;
  }
}

async function createItem(payload: any): Promise<Item> {
  const res = await api.post<ApiResponse<Item>>("/master/item", payload);
  return res.data.data;
}

// --- Main Script ---
const xlsPath = path.resolve(process.cwd(), "scripts", "DATAITEMBARANG.xls");

const seed = async () => {
  console.log("Starting Seed Item (API Mode)...");

  // 1. Auth
  await login();

  // 2. Parse Excel
  console.log("Reading Excel...");
  const itemsJson = readXlsAsItems(xlsPath);
  console.log(`Loaded items from Excel: ${itemsJson.length}`);

  if (itemsJson.length === 0) {
    console.log("No items found.");
    return;
  }

  // 3. Prepare Sets
  const uniqueSupplier = new Set<string>();
  const uniqueUnit = new Set<string>();
  const uniqueCategory = new Set<string>();

  itemsJson.forEach((item) => {
    if (item.kodePemasok) uniqueSupplier.add(item.kodePemasok);
    if (item.satuan1) uniqueUnit.add(item.satuan1);
    if (item.satuan2) uniqueUnit.add(item.satuan2);
    if (item.kodeJenis) uniqueCategory.add(item.kodeJenis);
  });

  // 4. Sync Master Data

  // --- Branch ---
  const branch = await getFirstBranch();
  console.log(`Using Branch: ${branch.name}`);

  // --- Suppliers ---
  let existingSuppliers = await getAllSuppliers();
  console.log(`Found ${existingSuppliers.length} existing suppliers.`);
  for (const code of uniqueSupplier) {
    if (!existingSuppliers.find((s) => s.code === code)) {
      console.log(`Creating Supplier: ${code}`);
      try {
        const newSupplier = await createSupplier(code, code);
        existingSuppliers.push(newSupplier);
      } catch (e: any) {
        console.error(
          `Failed create supplier ${code}:`,
          e.response?.data || e.message,
        );
      }
    }
  }

  // --- Units ---
  let existingUnits = await getAllUnits();
  console.log(`Found ${existingUnits.length} existing units.`);
  for (const u of uniqueUnit) {
    if (!u) continue;
    // Check by unit code/name (they are same in original script)
    if (!existingUnits.find((ex) => ex.unit === u)) {
      console.log(`Creating Unit: ${u}`);
      try {
        const newUnit = await createUnit(u);
        existingUnits.push(newUnit);
      } catch (e: any) {
        console.error(
          `Failed create unit ${u}:`,
          e.response?.data || e.message,
        );
      }
    }
  }

  // --- Categories ---
  let existingCategories = await getAllCategories();
  console.log(`Found ${existingCategories.length} existing categories.`);
  for (const code of uniqueCategory) {
    if (!existingCategories.find((c) => c.code === code)) {
      console.log(`Creating Category: ${code}`);
      try {
        const newCat = await createCategory(code, code);
        existingCategories.push(newCat);
      } catch (e: any) {
        console.error(
          `Failed create category ${code}:`,
          e.response?.data || e.message,
        );
      }
    }
  }

  // 5. Create Items
  console.log("Processing Items...");

  for (const item of itemsJson) {
    try {
      // Find dependencies
      const category = existingCategories.find(
        (c) => c.code === item.kodeJenis,
      );
      if (!category) {
        console.warn(
          `Category not found for item ${item.kodeItem}: ${item.kodeJenis}`,
        );
        continue;
      }
      const supplier = existingSuppliers.find(
        (s) => s.code === item.kodePemasok,
      );
      if (!supplier) {
        console.warn(
          `Supplier not found for item ${item.kodeItem}: ${item.kodePemasok}`,
        );
        continue;
      }

      // Check if exists
      const existingItem = await getItemByCode(item.kodeItem);
      if (existingItem) {
        console.log(`Item exists (skip): ${item.kodeItem}`);
        continue;
      }

      // Prepare Variants
      const variants = [
        {
          unit: item.satuan1,
          amount: item.kuantitas1 || 1, // Defaulting if missing
          sellPrice: item.hargaJualEcer1 || 0,
        },
      ];

      // Unit 2
      if (item.satuan2 && item.kuantitas2) {
        variants.push({
          unit: item.satuan2,
          amount: item.kuantitas2,
          sellPrice: item.hargaJualEcer2 || 0,
        });
      }

      const payload = {
        name: item.namaItem,
        code: item.kodeItem,
        masterSupplierCode: supplier.code,
        masterItemCategoryCode: category.code,
        isActive: true,
        masterItemVariants: variants,
      };

      await createItem(payload);
      console.log(
        `Item created: ${item.namaItem} (${variants.length} variants)`,
      );
    } catch (e: any) {
      console.error(
        `Failed to create item ${item.kodeItem}:`,
        e.response?.data || e.message,
      );
    }
  }

  console.log("Seed Item Completed.");
};

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
