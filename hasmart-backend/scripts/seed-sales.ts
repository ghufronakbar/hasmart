import path from "node:path";
import * as XLSX from "xlsx";
import axios from "axios";
import * as dotenv from "dotenv";
import { PrismaClient, SalesPaymentType } from "@prisma/client";
import { getFirstBranch } from "./seed-item";

dotenv.config();

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

const prisma = new PrismaClient();

// --- Main ---

const xlsPath = path.resolve(process.cwd(), "scripts", "PENJUALAN.xls");

const seed = async () => {
  // DEPRECATED
  // console.log("Starting Seed Sales (API Mode)...");
  // // 2. Parse Excel
  // console.log("Reading Excel...");
  // const doc = readPenjualanXls(xlsPath);
  // console.log(`Loaded transactions: ${doc.penjualan.length}`);
  // if (doc.penjualan.length === 0) return;
  // // 3. Master Data
  // const branch = await getFirstBranch();
  // console.log(`Using Branch: ${branch.name}`);
  // let successCount = 0;
  // let failCount = 0;
  // for (const entry of doc.penjualan) {
  //   try {
  //     const checkInvoice = await prisma.transactionSales.findFirst({
  //       where: {
  //         invoiceNumber: entry.nomor,
  //       },
  //     });
  //     if (checkInvoice) {
  //       console.log(`Sales: ${entry.nomor} already exists`);
  //       continue;
  //     }
  //     const sales = await prisma.transactionSales.create({
  //       data: {
  //         branchId: branch.id,
  //         notes: `Original Invoice: ${entry.nomor}`,
  //         cashReceived: entry.summary?.total || 0,
  //         paymentType: SalesPaymentType.CASH,
  //         cashChange:0,
  //         invoiceNumber:entry.nomor,
  //         recordedDiscountAmount: entry.summary?.diskon || 0,
  //         recordedSubTotalAmount: entry.summary?.subTotal || 0,
  //         recordedTotalAmount: entry.summary?.total || 0,
  //         transactionDate: new Date(),
  //         // transactionDate: new Date(entry.)
  //         // items: {
  //         //   create: entry.items.map((item) => ({
  //         //     masterItemVariantId: item.id,
  //         //     qty: item.kts || 1,
  //         //     discounts: [],
  //         //   })),
  //         // },
  //       },
  //     });
  //     console.log(
  //       `Created Sales: ${entry.nomor} -> TS-Success (Total: ${entry.summary?.total})`,
  //     );
  //     successCount++;
  //   } catch (e: any) {
  //     failCount++;
  //     console.error(
  //       `Failed ${entry.nomor}:`,
  //       e.response?.data?.errors || e.response?.data || e.message,
  //     );
  //   }
  // }
  // console.log(`\nSeed Sales Completed.`);
  // console.log(`Success: ${successCount}`);
  // console.log(`Failed: ${failCount}`);
};

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
