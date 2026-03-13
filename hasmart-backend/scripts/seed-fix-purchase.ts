import path from "node:path";
import * as XLSX from "xlsx";
import * as dotenv from "dotenv";
import {
  MasterItem,
  MasterItemCategory,
  Prisma,
  PrismaClient,
  RecordActionModelType,
  RecordActionType,
  User,
} from "@prisma/client";
import { getFirstBranch } from "./seed-item";
import bcrypt from "bcryptjs";
import { Decimal } from "@prisma/client/runtime/library";

dotenv.config();

// Configuration
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "12345678";

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

const prisma = new PrismaClient();

const getMissingCategory = async (): Promise<MasterItemCategory> => {
  let cat = await prisma.masterItemCategory.findFirst({
    where: {
      code: "MISSING",
    },
  });
  if (!cat) {
    cat = await prisma.masterItemCategory.create({
      data: {
        name: `Missing Category`,
        code: "MISSING",
      },
    });
  }
  return cat;
};

// ====== MAIN SCRIPT ======

const xlsPath = path.resolve(process.cwd(), "scripts", "PEMBELIAN.xls");

const seed = async () => {
  const pembelianJson: PembelianDoc = readPembelianXls(xlsPath);

  let totalUpdatePurchase = 0;
  let totalSkipPurchase = 0;
  let totalUpdateItem = 0;
  let totalSkipItem = 0;
  let totalSkipItemNoDiscount = 0;

  for await (const pembelian of pembelianJson.pembelian) {
    const { nomor } = pembelian.header;

    const checkInvoice = await prisma.transactionPurchase.findFirst({
      where: {
        invoiceNumber: nomor || `Missing Invoice ${Date.now()}`,
      },
      include: {
        transactionPurchaseItems: {
          include: {
            masterItem: true,
            transactionPurchaseDiscounts: true,
          },
        },
      },
    });

    if (checkInvoice) {
      // update diskon
      const totalDiscount = pembelian.items.reduce((acc, item) => {
        return acc + (item.diskon || 0);
      }, 0);
      await prisma.transactionPurchase.update({
        where: {
          id: checkInvoice.id,
        },
        data: {
          recordedDiscountAmount: totalDiscount,
        },
      });
      totalUpdatePurchase++;
      // update diskon item
      for await (const item of checkInvoice.transactionPurchaseItems) {
        if (item.transactionPurchaseDiscounts.length > 0) {
          console.log("🛑 Discount already recorded");
          totalSkipItem++;
          continue;
        }
        const findDiscount = pembelian.items.find(
          (i) => i.kode.toUpperCase() === item.masterItem?.code,
        );
        if (!findDiscount) {
          console.log("🛑 Discount not found or zero");
          totalSkipItemNoDiscount++;
          continue;
        }
        const totalDiscount = new Decimal(findDiscount?.diskon || 0).mul(
          new Decimal(findDiscount.kuantitas || 0),
        );
        const hargaBeli = new Decimal(findDiscount.hargaBeli || 0);
        const diskonPerUnit = new Decimal(findDiscount?.diskon || 0);
        // Guard: skip if hargaBeli is zero to avoid division by zero
        const percentage = hargaBeli.isZero()
          ? new Decimal(0)
          : Decimal.min(
              diskonPerUnit.div(hargaBeli).mul(100),
              new Decimal(999.99),
            );
        await prisma.transactionPurchaseItem.update({
          where: {
            id: item.id,
          },
          data: {
            recordedDiscountAmount: findDiscount?.diskon || 0,
            transactionPurchaseDiscounts: {
              create: {
                orderIndex: 1,
                percentage: percentage,
                recordedAmount:
                  (findDiscount?.diskon || 0) * (findDiscount.kuantitas || 0),
              },
            },
          },
        });
        totalUpdateItem++;
      }
    } else {
      console.log("🛑 Invoice doesn't exist");
      totalSkipPurchase++;
      continue;
    }
  }

  console.log("Total Update Purchase:", totalUpdatePurchase);
  console.log("Total Skip Purchase:", totalSkipPurchase);
  console.log("Total Update Item:", totalUpdateItem);
  console.log("Total Skip Item:", totalSkipItem);
  console.log("Total Skip Item No Discount:", totalSkipItemNoDiscount);
};

if (require.main === module) {
  seed().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
