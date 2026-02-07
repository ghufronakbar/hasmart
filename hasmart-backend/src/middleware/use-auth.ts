import { Request, Response, NextFunction } from "express";
import { UnauthorizedError } from "../utils/error";
import { JwtService, JwtPayload } from "../modules/common/jwt/jwt.service";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

function getAccessTokenFromQuery(req: Request): string | undefined {
  const q = req.query.accessToken;

  // accessToken bisa string | string[] | undefined
  const token = (
    typeof q === "string" ? q : Array.isArray(q) ? q[0] : undefined
  ) as string | undefined;

  const trimmed = token?.trim();
  if (!trimmed) return undefined;

  // optional: buang kalau ada format "Bearer xxx" di query
  if (trimmed.toLowerCase().startsWith("bearer ")) {
    const t = trimmed.slice(7).trim();
    return t || undefined;
  }

  return trimmed;
}

function getAccessTokenFromHeader(req: Request): string | undefined {
  const authHeader = req.headers.authorization;
  if (!authHeader) return undefined;

  const trimmed = authHeader.trim();
  if (!trimmed.toLowerCase().startsWith("bearer ")) return undefined;

  const token = trimmed.slice(7).trim();
  return token || undefined;
}

export const useAuth = (jwtService: JwtService) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 1) prioritas query
      const tokenFromQuery = getAccessTokenFromQuery(req);

      // 2) fallback header
      const token = tokenFromQuery ?? getAccessTokenFromHeader(req);

      if (!token) throw new UnauthorizedError();

      const payload = await jwtService.verifyAccess(token);
      if (!payload) throw new UnauthorizedError();

      req.user = payload;
      return next();
    } catch {
      return next(new UnauthorizedError());
    }
  };
};
