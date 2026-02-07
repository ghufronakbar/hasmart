import { z } from "zod";

const CommonEnvSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535),
  BASE_URL: z.string().url(),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRY: z.string().default("15m"),
  JWT_REFRESH_EXPIRY: z.string().default("24h"),
  DATABASE_URL: z.string().url(),
});

type CommonEnv = z.infer<typeof CommonEnvSchema>;

export class Config {
  public readonly common: CommonEnv;

  constructor() {
    this.common = this.loadEnv();
  }

  private loadEnv(): CommonEnv {
    const parsed = CommonEnvSchema.safeParse(process.env);
    if (!parsed.success) {
      console.error("Invalid environment variables:", parsed.error.format());
      throw new Error("Invalid environment variables");
    }
    return parsed.data;
  }
}
