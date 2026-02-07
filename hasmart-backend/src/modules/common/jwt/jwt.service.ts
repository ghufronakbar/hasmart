import jwt, { JwtPayload as JwtLibPayload } from "jsonwebtoken";
import { Config } from "../../../config";
import { PrismaService } from "../prisma/prisma.service";

export type JwtPayload = {
  userId: number;
  name: string;
};

function isJwtPayload(x: unknown): x is JwtPayload {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return typeof o.userId === "number" && typeof o.name === "string";
}

export class JwtService {
  private readonly accessSecret: string;
  private readonly refreshSecret: string;
  private readonly accessExpiry: string;
  private readonly refreshExpiry: string;

  constructor(
    private readonly config: Config,
    private readonly prisma: PrismaService,
  ) {
    this.accessSecret = config.common.JWT_ACCESS_SECRET;
    this.refreshSecret = config.common.JWT_REFRESH_SECRET;
    this.accessExpiry = config.common.JWT_ACCESS_EXPIRY;
    this.refreshExpiry = config.common.JWT_REFRESH_EXPIRY;
  }

  async signAccess(payload: JwtPayload): Promise<string> {
    return await new Promise<string>((resolve, reject) => {
      jwt.sign(
        payload,
        this.accessSecret,
        {
          algorithm: "HS256",
          expiresIn: this.accessExpiry as any,
        },
        (err, token) => {
          if (err || !token)
            return reject(err ?? new Error("Failed to sign Access Token"));
          resolve(token);
        },
      );
    });
  }

  async signRefresh(payload: JwtPayload): Promise<string> {
    // 1. Generate Token
    const token = await new Promise<string>((resolve, reject) => {
      jwt.sign(
        payload,
        this.refreshSecret,
        {
          algorithm: "HS256",
          expiresIn: this.refreshExpiry as any,
        },
        (err, token) => {
          if (err || !token)
            return reject(err ?? new Error("Failed to sign Refresh Token"));
          resolve(token);
        },
      );
    });

    // 2. Save to DB
    await this.prisma.user.update({
      where: { id: payload.userId },
      data: { refreshToken: token },
    });

    return token;
  }

  async verifyAccess(token: string): Promise<JwtPayload | null> {
    try {
      const decoded = await new Promise<JwtLibPayload | string>(
        (resolve, reject) => {
          jwt.verify(
            token,
            this.accessSecret,
            { algorithms: ["HS256"] },
            (err, payload) => {
              if (err || !payload)
                return reject(err ?? new Error("Invalid JWT"));
              resolve(payload);
            },
          );
        },
      );

      if (typeof decoded === "string") return null;

      const picked = {
        userId: (decoded as any).userId,
        name: (decoded as any).name,
      };
      return isJwtPayload(picked) ? picked : null;
    } catch {
      return null;
    }
  }

  async verifyRefreshToken(token: string): Promise<JwtPayload | null> {
    try {
      // 1. Verify Signature & Expiry
      const decoded = await new Promise<JwtLibPayload | string>(
        (resolve, reject) => {
          jwt.verify(
            token,
            this.refreshSecret,
            { algorithms: ["HS256"] },
            (err, payload) => {
              if (err || !payload)
                return reject(err ?? new Error("Invalid Refresh Token"));
              resolve(payload);
            },
          );
        },
      );

      if (typeof decoded === "string") return null;

      const picked = {
        userId: (decoded as any).userId,
        name: (decoded as any).name,
      };
      if (!isJwtPayload(picked)) return null;

      // 2. Check DB
      const user = await this.prisma.user.findUnique({
        where: { id: picked.userId },
      });

      if (!user || user.refreshToken !== token) {
        return null;
      }

      return picked;
    } catch {
      return null;
    }
  }

  async revokeRefresh(userId: number): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }
}
