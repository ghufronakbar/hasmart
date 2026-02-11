import path from "node:path";
import * as XLSX from "xlsx";
import { getFirstBranch } from "./seed-item";
import {
  MasterItemCategory,
  MasterSupplier,
  Prisma,
  PrismaClient,
  RecordActionModelType,
  RecordActionType,
  SalesPaymentType,
  User,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { Decimal } from "@prisma/client/runtime/library";

export interface PosReportDoc {
  meta?: {
    app?: string; // "HaSmart"
    report?: string; // "LAPORAN POINT OF SALES"
    address?: string;
    periode?: {
      from?: string; // ISO yyyy-mm-dd
      to?: string; // ISO yyyy-mm-dd
      raw?: string; // "Periode 18/01/2026 Sampai 06/02/2026"
    };
    phone?: string;
  };
  sales: PosSaleEntry[];
}

export interface PosSaleEntry {
  header: PosSaleHeader;
  items: PosSaleItem[];
  summary?: PosSaleSummary;
}

export interface PosSaleHeader {
  nomor?: string; // "SL2601000045"
  pelanggan?: string; // "Umum"
  tanggal?: string; // ISO
  kasir?: string; // "SHIFT 1"
}

export interface PosSaleItem {
  no: number;
  kode: string;
  nama: string;
  kuantitas: number | null;
  sat: string;
  harga: number | null;
  diskon: number | null;
  jumlah: number | null;
}

export interface PosSaleSummary {
  subTotal?: number | null;
  diskon?: number | null;
  total?: number | null;
}

function toText(v: unknown): string {
  if (v == null) return "";
  return String(v).trim();
}

// angka di POS kadang "5,800" (thousand) tanpa decimal
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
      // "107,000.00"
      s = s.replace(/,/g, "");
    } else {
      // "1.384,92"
      s = s.replace(/\./g, "").replace(/,/g, ".");
    }
  } else if (hasComma && !hasDot) {
    // "5,800" => thousand, "12,5" => decimal
    if (/^\d{1,3}(,\d{3})+$/.test(s)) s = s.replace(/,/g, "");
    else s = s.replace(/,/g, ".");
  } else if (!hasComma && hasDot) {
    // "1.234" thousand
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

function parsePeriode(raw: string): {
  raw: string;
  from?: string;
  to?: string;
} {
  // contoh: "Periode 18/01/2026 Sampai 06/02/2026"
  const m = raw.match(
    /Periode\s+(\d{1,2}\/\d{1,2}\/\d{4})\s+Sampai\s+(\d{1,2}\/\d{1,2}\/\d{4})/i,
  );
  if (!m) return { raw };

  return {
    raw,
    from: parseDateDDMMYYYY(m[1]),
    to: parseDateDDMMYYYY(m[2]),
  };
}

function isPosHeaderRow(row: string[]): boolean {
  // "Nomor",":",..., "Pelanggan",":",..., "Tanggal",":",..., "Kasir",":",..., "No","Kode","Nama",...
  const hasNomor =
    row.includes("Nomor") &&
    row.includes("Pelanggan") &&
    row.includes("Tanggal") &&
    row.includes("Kasir");
  const hasTableHead =
    row.includes("No") &&
    row.includes("Kode") &&
    row.includes("Nama") &&
    row.includes("Kuantitas");
  return hasNomor && hasTableHead;
}

function isItemRow(row: string[]): boolean {
  return /^\d+$/.test(row[0] ?? "");
}

function isSummaryRow(row: string[]): boolean {
  return (row[0] ?? "") === "Sub Total" && row.includes("Total");
}

function parseHeaderRow(row: string[]): PosSaleHeader {
  const header: PosSaleHeader = {};
  const labels = new Set(["Nomor", "Pelanggan", "Tanggal", "Kasir"]);

  for (let i = 0; i < row.length; i++) {
    const cell = row[i];
    if (!labels.has(cell)) continue;
    if (row[i + 1] !== ":") continue;

    const val = row[i + 2];

    if (cell === "Nomor") header.nomor = toText(val) || undefined;
    if (cell === "Pelanggan") header.pelanggan = toText(val) || undefined;
    if (cell === "Tanggal") header.tanggal = parseDateDDMMYYYY(val);
    if (cell === "Kasir") header.kasir = toText(val) || undefined;
  }

  return header;
}

function parseItemRow(row: string[]): PosSaleItem | null {
  // No | Kode | Nama | Kuantitas | Sat | Harga | Diskon | Jumlah
  const no = parseNumberSmart(row[0]);
  if (no == null) return null;

  const item: PosSaleItem = {
    no: Math.trunc(no),
    kode: toText(row[1]),
    nama: toText(row[2]),
    kuantitas: parseNumberSmart(row[3]),
    sat: toText(row[4]),
    harga: parseNumberSmart(row[5]),
    diskon: parseNumberSmart(row[6]),
    jumlah: parseNumberSmart(row[7]),
  };

  if (!item.kode && !item.nama) return null;
  return item;
}

function parseSummaryRow(row: string[]): PosSaleSummary {
  // "Sub Total", <num>, "Diskon", <num>, "Total", <num>
  return {
    subTotal: parseNumberSmart(row[1]),
    diskon: parseNumberSmart(row[3]),
    total: parseNumberSmart(row[5]),
  };
}

function readPosXls(filePath: string): PosReportDoc {
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
  const doc: PosReportDoc = { sales: [] };

  // row 1 meta (index 0)
  if (normalized.length > 0) {
    const r0 = normalized[0];
    const periodeRaw = toText(r0[3]);
    doc.meta = {
      app: r0[0] || undefined,
      report: r0[1] || undefined,
      address: r0[2] || undefined,
      periode: periodeRaw ? parsePeriode(periodeRaw) : undefined,
      phone: r0[4] || undefined,
    };
  }

  let current: PosSaleEntry | null = null;

  // mulai dari row ke-2 (index 1)
  for (let i = 1; i < normalized.length; i++) {
    const row = normalized[i];
    if (!row || row.every((c) => c === "")) continue;

    if (isPosHeaderRow(row)) {
      if (current) doc.sales.push(current);
      current = { header: parseHeaderRow(row), items: [] };
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

  if (current) doc.sales.push(current);

  return doc;
}

const prisma = new PrismaClient();

// ===== USAGE =====
// sesuaikan nama file kalau beda
const xlsPath = path.resolve(process.cwd(), "scripts", "POINT_OF_SALES.xls");

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

const getMissingSupplier = async (): Promise<MasterSupplier> => {
  let supplier = await prisma.masterSupplier.findFirst({
    where: {
      code: "MISSING",
    },
  });
  if (!supplier) {
    supplier = await prisma.masterSupplier.create({
      data: {
        name: `Missing Supplier`,
        code: "MISSING",
      },
    });
  }
  return supplier;
};

const seed = async () => {
  const posJson: PosReportDoc = readPosXls(xlsPath);
  console.log(`Loaded POS entries: ${posJson.sales.length}`);

  const branch = await getFirstBranch();
  const missingCategory = await getMissingCategory();
  const missingSupplier = await getMissingSupplier();

  for await (const sale of posJson.sales) {
    const check = await prisma.transactionSales.findUnique({
      where: {
        invoiceNumber: sale.header.nomor || `Missing Invoice ${Date.now()}`,
      },
    });

    if (check) {
      console.log(`Skipping sale with invoice number ${sale.header.nomor}`);
      continue;
    }

    let user: User | null = null;

    if (!sale.header.kasir) {
      user = await prisma.user.findFirst({
        where: {
          name: {
            equals: "ADMIN",
            mode: "insensitive",
          },
        },
      });
    } else if (sale.header.kasir) {
      user = await prisma.user.findFirst({
        where: {
          name: {
            equals: sale.header.kasir,
            mode: "insensitive",
          },
        },
      });

      if (!user) {
        const hashedPassword = await bcrypt.hash("12345678", 10);
        user = await prisma.user.create({
          data: {
            name: sale.header.kasir?.toUpperCase(),
            password: hashedPassword,
            isActive: true,
            isSuperUser: false,
          },
        });
      }
    }

    const createSale = await prisma.transactionSales.create({
      data: {
        branchId: branch.id,
        cashChange: 0,
        cashReceived: sale.summary?.total || 0,
        invoiceNumber: sale.header.nomor || `Missing Invoice ${Date.now()}`,
        paymentType: SalesPaymentType.CASH,
        recordedDiscountAmount: sale.summary?.diskon || 0,
        recordedSubTotalAmount: sale.summary?.subTotal || 0,
        recordedTotalAmount: sale.summary?.total || 0,
        transactionDate: new Date(sale.header.tanggal || new Date()),
        createdAt: new Date(sale.header.tanggal || new Date()),
        updatedAt: new Date(sale.header.tanggal || new Date()),
      },
      include: {
        transactionSalesItems: true,
      },
    });

    for await (const item of sale.items) {
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
            masterSupplierId: missingSupplier.id, // asumsikan supplier missing / karena tidak ada di seed:item
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
            // tidak ada data mengenai harga beli, maka diasumsikan 0
            recordedBuyPrice: 0,
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

      const createSalesItem = await prisma.transactionSalesItem.create({
        data: {
          transactionSalesId: createSale.id,
          masterItemId: masterItem.id,
          qty: item.kuantitas || 0,
          recordedBuyPrice: new Decimal(
            masterItem.recordedBuyPrice.mul(masterItemVariant?.amount || 1),
          ),
          salesPrice: new Decimal(item.harga || 0),
          recordedDiscountAmount: new Decimal(item.diskon || 0),
          //   pada data total adn sub total sama (karena tidak ada pajak dan diskon)
          recordedTotalAmount: new Decimal(item.jumlah || 0),
          recordedSubTotalAmount: new Decimal(item.jumlah || 0),
          masterItemVariantId: masterItemVariant?.id!,
          // karena tidak ada data mengenai konversi, maka diasumsikan 1
          recordedConversion: masterItemVariant?.amount || 1,
          totalQty: (item.kuantitas || 1) * (masterItemVariant?.amount || 1),
        },
      });
      createSale.transactionSalesItems.push(createSalesItem);
    }
    // create record action
    await prisma.recordAction.create({
      data: {
        actionType: RecordActionType.CREATE,
        modelId: createSale.id,
        modelType: RecordActionModelType.TRANSACTION_SALES,
        userId: user?.id!,
        payloadBefore: Prisma.DbNull,
        payloadAfter: createSale,
      },
    });

    console.log("✅ Sale created:", createSale.id);
  }
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
