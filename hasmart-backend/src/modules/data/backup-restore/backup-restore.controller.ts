import { BaseController } from "../../../base/base-controller";
import { BackupRestoreService } from "./backup-restore.service";
import { Request, Response } from "express";
import { ValidationError } from "../../../utils/error";
import { createReadStream, promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

export class BackupRestoreController extends BaseController {
  constructor(private service: BackupRestoreService) {
    super();
  }

  // Download backup .dump (pg_dump custom format)
  getBackupFile = async (req: Request, res: Response) => {
    const { filePath, filename } =
      await this.service.getBackupSqlDumpFilePath();

    res.status(200);
    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Cache-Control", "no-store");

    const stream = createReadStream(filePath);

    // cleanup tmp file setelah response selesai / error
    const cleanup = async () => {
      try {
        await fs.unlink(filePath);
      } catch {
        // ignore
      }
    };

    stream.on("error", async (err) => {
      await cleanup();
      // biar handler error kamu yang tangani (atau res.status(500).json)
      throw err;
    });

    res.on("close", cleanup);
    res.on("finish", cleanup);

    return stream.pipe(res);
  };

  // Restore dari file .dump
  restoreBackupFile = async (req: Request, res: Response) => {
    if (!req.file) {
      throw new ValidationError("File not found");
    }

    const headerAuth = req.headers.authorization;

    // Kalau multer kamu diskStorage => ada req.file.path
    // Kalau masih memoryStorage => pakai req.file.buffer, kita tulis dulu ke tmp file.
    let dumpPath: string | undefined = (req.file as any).path;

    if (!dumpPath) {
      if (!req.file.buffer) {
        throw new ValidationError("File buffer not found");
      }
      dumpPath = path.join(
        tmpdir(),
        `restore_${new Date().toISOString().replace(/[:.]/g, "-")}.dump`,
      );
      await fs.writeFile(dumpPath, req.file.buffer);
    }

    try {
      await this.service.restoreSqlDumpFromFilePath(dumpPath, headerAuth);
      return this.sendOk(req, res, { message: "Restore success" });
    } finally {
      // kalau file berasal dari tmp buatan kita, hapus
      // (kalau diskStorage kamu simpan di tmp juga, tetap aman)
      try {
        await fs.unlink(dumpPath);
      } catch {
        // ignore
      }
    }
  };
}
