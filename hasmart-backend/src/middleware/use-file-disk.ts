import multer from "multer";
import { tmpdir } from "node:os";
import path from "node:path";
import { ValidationError } from "../utils/error";

export const useFileDisk = (field: string, allowedMimes: string[]) => {
  const upload = multer({
    storage: multer.diskStorage({
      destination: tmpdir(),
      filename: (_req, file, cb) => {
        const safe = file.originalname.replace(/[^\w.\-]+/g, "_");
        cb(null, `${Date.now()}_${safe}`);
      },
    }),
    fileFilter: (_req, file, cb) => {
      if (allowedMimes.length === 0) return cb(null, true);
      if (allowedMimes.includes(file.mimetype)) return cb(null, true);
      cb(new ValidationError(`Invalid mime type: ${file.mimetype}`));
    },
    limits: {
      fileSize: 1024 * 1024 * 1024, // 1GB (sesuaikan)
    },
  });

  return upload.single(field);
};
