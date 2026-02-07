// src/modules/data/backup-restore/backup-restore.service.ts
//
// Backup/Restore pakai Postgres native tools (pg_dump / pg_restore).
// Output backup: *.dump (custom format) -> cocok untuk data besar & cepat.
//
// Problem "transaction_timeout":
// - Biasanya muncul kalau file dump dibuat oleh pg_dump versi lebih baru (mis. PG16)
//   lalu direstore ke server PG15 => dump berisi: `SET transaction_timeout = 0;`
//   yang tidak dikenal di PG15.
// - Solusi terbaik: pastikan pg_dump/pg_restore MATCH major server (mis. sama-sama 15).
// - File ini juga menyediakan fallback restore: `pg_restore -f - | psql` sambil
//   memfilter line SET transaction_timeout.
//
// Catatan:
// - Method restore menerima `filePath` (path file .dump di disk). Jadi middleware upload sebaiknya diskStorage.
// - Kamu bisa override path binary via env:
//     PG_DUMP_BIN, PG_RESTORE_BIN, PSQL_BIN
//   atau via cfg.common.* jika kamu simpan di config.

import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { promises as fs, constants as fsConstants } from "node:fs";
import { Transform } from "node:stream";

import { Config } from "../../../config";
import { PrismaService } from "../../common/prisma/prisma.service";
import { ForbiddenError, ValidationError } from "../../../utils/error";
import { JwtService } from "../../common/jwt/jwt.service";
import { PasswordService } from "../../common/password/password.service";

type RunResult = { stdout: string; stderr: string; code: number };

function runCapture(
  cmd: string,
  args: string[],
  env?: NodeJS.ProcessEnv,
): Promise<RunResult> {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, {
      env: { ...process.env, ...env },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    p.stdout.on("data", (d) => (stdout += d.toString()));
    p.stderr.on("data", (d) => (stderr += d.toString()));

    p.on("error", reject);
    p.on("close", (code) => resolve({ stdout, stderr, code: code ?? -1 }));
  });
}

async function run(cmd: string, args: string[], env?: NodeJS.ProcessEnv) {
  const r = await runCapture(cmd, args, env);
  if (r.code === 0) return;
  throw new Error(`${cmd} exited ${r.code}: ${r.stderr || r.stdout}`);
}

async function existsExecutable(p: string) {
  try {
    await fs.access(p, fsConstants.X_OK);
    return true;
  } catch {
    return false;
  }
}

function parsePgToolMajorFromVersionText(text: string): number | null {
  // contoh: "pg_dump (PostgreSQL) 15.15 (Homebrew)"
  const m = text.match(/\b(PostgreSQL)\b\s+(\d+)(?:\.\d+)?/i);
  if (!m) return null;
  const n = Number(m[2]);
  return Number.isFinite(n) ? n : null;
}

function parseServerMajorFromServerVersion(version: string): number {
  // contoh: "15.15" => 15
  const majorStr = version.split(".")[0];
  const major = Number(majorStr);
  if (!Number.isFinite(major) || major <= 0) {
    throw new Error(`Invalid server_version: ${version}`);
  }
  return major;
}

class LineFilter extends Transform {
  private buf = "";
  constructor(private shouldDrop: (line: string) => boolean) {
    super();
  }
  _transform(chunk: any, _enc: any, cb: any) {
    this.buf += chunk.toString("utf8");
    let idx = 0;
    while ((idx = this.buf.indexOf("\n")) >= 0) {
      const lineWithNL = this.buf.slice(0, idx + 1);
      this.buf = this.buf.slice(idx + 1);

      const lineNoNL = lineWithNL.replace(/\n$/, "").replace(/\r$/, "");
      if (!this.shouldDrop(lineNoNL)) this.push(lineWithNL);
    }
    cb();
  }
  _flush(cb: any) {
    if (this.buf) {
      if (!this.shouldDrop(this.buf.replace(/\r$/, ""))) this.push(this.buf);
    }
    cb();
  }
}

export class BackupRestoreService {
  constructor(
    private readonly cfg: Config,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly passwordService: PasswordService,
  ) {}

  private get databaseUrl() {
    return this.cfg.common.DATABASE_URL;
  }

  private async getServerMajorVersion(): Promise<number> {
    // Prefer server_version_num if possible (lebih presisi, tidak ada suffix)
    try {
      const rows = await this.prisma.$queryRawUnsafe<
        Array<{ server_version_num: string }>
      >(`SHOW server_version_num;`);
      const numStr = rows?.[0]?.server_version_num;
      const num = Number(numStr);
      if (Number.isFinite(num) && num > 0) {
        // 150015 -> 15
        return Math.floor(num / 10000);
      }
    } catch {
      // ignore
    }

    const rows =
      await this.prisma.$queryRawUnsafe<Array<{ server_version: string }>>(
        `SHOW server_version;`,
      );
    const v = rows?.[0]?.server_version;
    if (!v) throw new Error("Unable to read server_version");
    return parseServerMajorFromServerVersion(v);
  }

  private async resolvePgTool(
    tool: "pg_dump" | "pg_restore" | "psql",
    serverMajor: number,
  ): Promise<string> {
    // 1) Prioritas env override
    const envKey =
      tool === "pg_dump"
        ? "PG_DUMP_BIN"
        : tool === "pg_restore"
          ? "PG_RESTORE_BIN"
          : "PSQL_BIN";

    const fromEnv = process.env[envKey];
    if (fromEnv && (await existsExecutable(fromEnv))) return fromEnv;

    // 2) Optional config override (kalau kamu set di Config)
    const fromCfg =
      tool === "pg_dump"
        ? (this.cfg.common as any).PG_DUMP_BIN
        : tool === "pg_restore"
          ? (this.cfg.common as any).PG_RESTORE_BIN
          : (this.cfg.common as any).PSQL_BIN;

    if (
      typeof fromCfg === "string" &&
      fromCfg &&
      (await existsExecutable(fromCfg))
    ) {
      return fromCfg;
    }

    // 3) Auto-detect Homebrew Postgres matching server major
    // Apple Silicon: /opt/homebrew/opt/postgresql@15/bin/pg_dump
    // Intel:         /usr/local/opt/postgresql@15/bin/pg_dump
    const candidates = [
      `/opt/homebrew/opt/postgresql@${serverMajor}/bin/${tool}`,
      `/usr/local/opt/postgresql@${serverMajor}/bin/${tool}`,
    ];

    for (const c of candidates) {
      if (await existsExecutable(c)) return c;
    }

    // 4) fallback PATH
    return tool;
  }

  private async assertToolMatchesServerMajor(
    toolPath: string,
    serverMajor: number,
  ) {
    const r = await runCapture(toolPath, ["--version"]);
    const text = (r.stdout || r.stderr).trim();

    const toolMajor = parsePgToolMajorFromVersionText(text);
    if (!toolMajor) return; // tidak bisa parse, jangan block

    if (toolMajor !== serverMajor) {
      throw new ValidationError(
        [
          `Postgres server major version = ${serverMajor}, tapi tool = ${toolMajor}.`,
          `Tool path: ${toolPath}`,
          `Tool output: ${text}`,
          ``,
          `Fix: pakai pg_dump/pg_restore/psql yang matching dengan server major.`,
          `- macOS brew: brew install postgresql@${serverMajor}`,
          `- env override:`,
          `  PG_DUMP_BIN=/opt/homebrew/opt/postgresql@${serverMajor}/bin/pg_dump`,
          `  PG_RESTORE_BIN=/opt/homebrew/opt/postgresql@${serverMajor}/bin/pg_restore`,
          `  PSQL_BIN=/opt/homebrew/opt/postgresql@${serverMajor}/bin/psql`,
        ].join("\n"),
      );
    }
  }

  private async unlinkQuiet(filePath: string) {
    try {
      await fs.unlink(filePath);
    } catch {
      // ignore
    }
  }

  private async restoreDumpViaPipeFiltered(
    pgRestoreBin: string,
    psqlBin: string,
    dumpFilePath: string,
  ) {
    // pg_restore output SQL to stdout (tanpa connect DB)
    const restoreProc = spawn(pgRestoreBin, [
      "--clean",
      "--if-exists",
      "--no-owner",
      "--no-privileges",
      "--format=custom",
      "-f",
      "-", // to stdout
      dumpFilePath,
    ]);

    // psql execute script ke DB target
    const psqlProc = spawn(psqlBin, [
      "--dbname",
      this.getCleanDatabaseUrl(),
      "--set",
      "ON_ERROR_STOP=on",
    ]);

    let restoreErr = "";
    let psqlErr = "";

    restoreProc.stderr.on("data", (d) => (restoreErr += d.toString()));
    psqlProc.stderr.on("data", (d) => (psqlErr += d.toString()));

    const filter = new LineFilter((line) => {
      // drop line yang bikin PG15 error
      // contoh: SET transaction_timeout = 0;
      return (
        line.startsWith("SET transaction_timeout") ||
        line.includes(`transaction_timeout`)
      );
    });

    restoreProc.stdout.pipe(filter).pipe(psqlProc.stdin);

    const [rcRestore, rcPsql] = await Promise.all([
      new Promise<number>((res) => restoreProc.on("close", (c) => res(c ?? 1))),
      new Promise<number>((res) => psqlProc.on("close", (c) => res(c ?? 1))),
    ]);

    if (rcRestore !== 0)
      throw new Error(`pg_restore failed (${rcRestore}): ${restoreErr}`);
    if (rcPsql !== 0) throw new Error(`psql failed (${rcPsql}): ${psqlErr}`);
  }

  private getCleanDatabaseUrl(): string {
    try {
      const url = new URL(this.databaseUrl);
      url.search = ""; // Remove ?schema=public etc
      return url.toString();
    } catch {
      return this.databaseUrl;
    }
  }

  // export *.dump (custom)
  async getBackupSqlDumpFilePath(): Promise<{
    filePath: string;
    filename: string;
  }> {
    const serverMajor = await this.getServerMajorVersion();

    const pgDump = await this.resolvePgTool("pg_dump", serverMajor);
    await this.assertToolMatchesServerMajor(pgDump, serverMajor);

    const filename = `backup_${new Date().toISOString().replace(/[:.]/g, "-")}.dump`;
    const filePath = path.join(tmpdir(), filename);

    // NOTE: gunakan --dbname <url> (lebih stabil daripada taruh url tanpa flag)
    await run(pgDump, [
      "--format=custom",
      "--no-owner",
      "--no-privileges",
      "--file",
      filePath,
      "--dbname",
      this.getCleanDatabaseUrl(),
    ]);

    return { filePath, filename };
  }

  // restore from *.dump (path on disk)
  async restoreSqlDumpFromFilePath(filePath: string, headerAuth?: string) {
    const countUser = await this.prisma.user.count();
    // jika ada user maka cek, harus super user
    if (countUser > 0) {
      let token = headerAuth || "";
      if (token.startsWith("Bearer ")) {
        token = token.slice(7);
      }
      const verify = await this.jwtService.verifyAccess(token);
      if (!verify) {
        throw new ForbiddenError(
          "Hanya super user yang dapat restore database",
        );
      }
      const user = await this.prisma.user.findUnique({
        where: {
          id: verify.userId,
        },
      });
      if (!user) {
        throw new ForbiddenError(
          "Hanya super user yang dapat restore database",
        );
      }
      if (!user.isSuperUser) {
        throw new ForbiddenError(
          "Hanya super user yang dapat restore database",
        );
      }
    }
    // jika tidak ada user maka tidak perlu cek (bisa restore di first time setup)

    const serverMajor = await this.getServerMajorVersion();

    const pgRestore = await this.resolvePgTool("pg_restore", serverMajor);
    const psql = await this.resolvePgTool("psql", serverMajor);

    await this.assertToolMatchesServerMajor(pgRestore, serverMajor);
    await this.assertToolMatchesServerMajor(psql, serverMajor);

    // optional debug
    // const vr = await runCapture(pgRestore, ["--version"]);
    // console.log("pg_restore:", (vr.stdout || vr.stderr).trim());

    try {
      // Normal path: pg_restore langsung ke DB
      await run(pgRestore, [
        "--clean",
        "--if-exists",
        "--no-owner",
        "--no-privileges",
        "--exit-on-error",
        "--dbname",
        this.getCleanDatabaseUrl(),
        filePath,
      ]);

      // setelah restore, jika user ada, maka update menjadi default untuk super user
      const hashedPassword = await this.passwordService.hash("12345678");
      await this.prisma.user.updateMany({
        where: {
          isSuperUser: true,
        },
        data: {
          name: "admin",
          password: hashedPassword,
          refreshToken: null,
        },
      });

      // force logout jika berhasil di client

      return { message: "Restore success", filtered: false };
    } catch (e: any) {
      const msg = String(e?.message ?? e);

      // Fallback: kalau dump mengandung SET transaction_timeout (PG16+) sementara server PG15
      if (
        msg.includes(
          `unrecognized configuration parameter "transaction_timeout"`,
        ) ||
        msg.includes("SET transaction_timeout")
      ) {
        await this.restoreDumpViaPipeFiltered(pgRestore, psql, filePath);
        return { message: "Restore success (filtered)", filtered: true };
      }

      throw e;
    }
  }

  async cleanupTempFile(filePath: string) {
    await this.unlinkQuiet(filePath);
  }
}
