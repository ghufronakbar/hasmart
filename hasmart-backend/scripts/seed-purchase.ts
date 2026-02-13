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
  let branch = await getFirstBranch();
  const missingCategory = await getMissingCategory();
  for await (const pembelian of pembelianJson.pembelian) {
    const { admin, jatuhTempo, lokasi, nomor, pemasok, tanggal } =
      pembelian.header;

    if (!pemasok) {
      console.log("Skipping purchase with no supplier");
      continue;
    }

    let supplier = await prisma.masterSupplier.findFirst({
      where: {
        name: pemasok?.trim().toUpperCase(),
      },
    });
    if (!supplier) {
      supplier = await prisma.masterSupplier.create({
        data: {
          name: pemasok.trim().toUpperCase(),
          code: pemasok.trim().toUpperCase(),
          address: lokasi || null,
        },
      });
    }

    let user: User | null = null;

    if (!admin) {
      console.log("🟡 User admin is null, using ADMIN");
      user = await prisma.user.findFirst({
        where: {
          name: "ADMIN",
        },
      });
    }

    user = await prisma.user.findFirst({
      where: {
        name: admin?.trim().toUpperCase(),
      },
    });
    if (!user) {
      console.log("🟡 Creating new user:", admin);
      const hashedPassword = await bcrypt.hash(admin || "12345678", 10);
      user = await prisma.user.create({
        data: {
          name: admin?.trim().toUpperCase() || `Missing Admin ${Date.now()}`,
          password: hashedPassword,
          isActive: true,
          isSuperUser: false,
        },
      });
    }

    const checkInvoice = await prisma.transactionPurchase.findFirst({
      where: {
        invoiceNumber: nomor || `Missing Invoice ${Date.now()}`,
      },
    });
    if (checkInvoice) {
      console.log("🟡 Invoice already exists:", nomor);
      continue;
    }

    const createPurchase = await prisma.transactionPurchase.create({
      data: {
        dueDate: new Date(jatuhTempo || new Date()),
        transactionDate: new Date(tanggal || new Date()),
        createdAt: new Date(tanggal || new Date()),
        updatedAt: new Date(tanggal || new Date()),
        invoiceNumber: nomor || `Missing Invoice ${Date.now()}`,
        recordedDiscountAmount: pembelian.summary?.diskon || 0,
        recordedSubTotalAmount: pembelian.summary?.subTotal || 0,
        recordedTotalAmount: pembelian.summary?.total || 0,
        recordedTaxAmount: 0,
        recordedTaxPercentage: 0,
        branchId: branch.id,
        masterSupplierId: supplier.id,
        notes: pembelian.summary?.keterangan || "",
      },
      include: {
        transactionPurchaseItems: true,
      },
    });

    for await (const item of pembelian.items) {
      let masterItem = await prisma.masterItem.findFirst({
        where: {
          code: item.kode.toUpperCase(),
        },
        include: {
          masterItemVariants: true,
        },
      });
      if (!masterItem) {
        console.log("🟡 Creating new item:", item.nama, item.kode);
        masterItem = await prisma.masterItem.create({
          data: {
            name: item.nama,
            code: item.kode.toUpperCase(),
            isActive: true,
            recordedBuyPrice: 0,
            masterItemCategoryId: missingCategory.id,
            masterSupplierId: supplier.id, // samakan dengan supplier barang/item tiap pembelian
          },
          include: {
            masterItemVariants: true,
          },
        });
      }

      const isVariantExist = masterItem.masterItemVariants.find(
        (variant) => variant.unit?.toUpperCase() === item.sat?.toUpperCase(),
      );

      if (!isVariantExist) {
        console.log(
          "🟡 Creating new variant for item:",
          masterItem.name,
          item.sat,
        );
        const createVariant = await prisma.masterItemVariant.create({
          data: {
            // karena tidak ada data mengenai konversi, maka diasumsikan 1
            unit: item.sat?.toUpperCase(),
            amount: 1,
            masterItemId: masterItem.id,
            isBaseUnit: true,
            recordedBuyPrice: item.hargaBeli || 0,
            recordedProfitAmount: 0,
            sellPrice: 0,
            recordedProfitPercentage: 0,
          },
        });
        masterItem.masterItemVariants.push(createVariant);
      }

      const masterItemVariant = masterItem.masterItemVariants.find(
        (variant) => variant.unit?.toUpperCase() === item.sat?.toUpperCase(),
      );

      const createPurchaseItem = await prisma.transactionPurchaseItem.create({
        data: {
          transactionPurchaseId: createPurchase.id,
          masterItemId: masterItem.id,
          qty: item.kuantitas || 0,
          purchasePrice: item.hargaBeli || 0,
          recordedDiscountAmount: item.diskon || 0,
          recordedTotalAmount: item.jumlah || 0,
          recordedSubTotalAmount: item.jumlah || 0,
          recordedAfterTaxAmount: item.jumlah || 0,
          masterItemVariantId: masterItemVariant?.id!,
          // karena tidak ada data mengenai konversi, maka diasumsikan 1
          recordedConversion: masterItemVariant?.amount || 1,
          totalQty: (item.kuantitas || 1) * (masterItemVariant?.amount || 1),
        },
      });
      createPurchase.transactionPurchaseItems.push(createPurchaseItem);

      // todo: refresh buy price
      const purchases = await prisma.transactionPurchaseItem.findMany({
        where: {
          masterItemId: masterItem.id,
        },
        select: {
          totalQty: true,
          recordedSubTotalAmount: true,
          masterItem: {
            select: {
              masterItemVariants: {
                select: {
                  recordedProfitPercentage: true,
                },
              },
            },
          },
        },
      });

      const weight = purchases.reduce((acc, purchase) => {
        return acc + purchase.totalQty;
      }, 0);

      const totalPurchasePrice = purchases.reduce((acc, purchase) => {
        return purchase.recordedSubTotalAmount.add(acc);
      }, new Decimal(0));

      const averagePurchasePrice = totalPurchasePrice.div(weight);

      // catat record buy price
      const updateMasterItem = await prisma.masterItem.update({
        where: {
          id: masterItem.id,
        },
        data: {
          recordedBuyPrice: averagePurchasePrice,
        },
        include: {
          masterItemVariants: true,
        },
      });

      // catat stok baru
      const createStock = await prisma.itemBranch.upsert({
        where: {
          masterItemId_branchId: {
            masterItemId: masterItem.id,
            branchId: branch.id,
          },
        },
        update: {
          recordedStock: {
            increment: (item.kuantitas || 0) * (masterItemVariant?.amount || 1),
          },
        },
        create: {
          masterItemId: masterItem.id,
          branchId: branch.id,
          recordedStock:
            (item.kuantitas || 0) * (masterItemVariant?.amount || 1),
          recordedFrontStock: 0,
        },
      });

      for await (const variant of updateMasterItem.masterItemVariants) {
        const buyprice = updateMasterItem.recordedBuyPrice.mul(variant.amount);
        const profit = variant.sellPrice.sub(buyprice);
        const percentage = profit.mul(100).div(buyprice);
        const updateMasterItemVariant = await prisma.masterItemVariant.update({
          where: {
            id: variant.id,
          },
          data: {
            recordedBuyPrice: averagePurchasePrice.mul(variant?.amount || 1),
            recordedProfitPercentage: percentage,
            recordedProfitAmount: profit,
          },
        });
      }
    }

    // create record action
    await prisma.recordAction.create({
      data: {
        actionType: RecordActionType.CREATE,
        modelId: createPurchase.id,
        modelType: RecordActionModelType.TRANSACTION_PURCHASE,
        userId: user.id,
        payloadBefore: Prisma.DbNull,
        payloadAfter: createPurchase,
      },
    });

    console.log("✅ Purchase created:", createPurchase.id);
  }
};

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
