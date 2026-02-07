import multer from "multer";
import { Request } from "express";
import { BadRequestError } from "../utils/error";

export const useFile = (
  fieldName: string = "file",
  allowedMimeTypes: string[] = [],
  maxSize: number = 5 * 1024 * 1024, // 5MB default
) => {
  const storage = multer.memoryStorage();

  const fileFilter = (
    req: Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback,
  ) => {
    if (
      allowedMimeTypes.length > 0 &&
      !allowedMimeTypes.includes(file.mimetype)
    ) {
      return cb(
        new BadRequestError(
          `Invalid file type. Allowed: ${allowedMimeTypes.join(", ")}`,
        ) as any,
        false,
      );
    }
    cb(null, true);
  };

  return multer({
    storage,
    fileFilter,
    limits: { fileSize: maxSize },
  }).single(fieldName);
};
