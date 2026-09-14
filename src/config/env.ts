import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(8080),
  DATABASE_URL: z.url(),
  BETTER_AUTH_SECRET: z
    .string()
    .min(16, "BETTER_AUTH_SECRET should be at least 16 characters"),
  BETTER_AUTH_URL: z.url(),
  
  // Browsers send Origin without a trailing slash, so strip one if present
  FRONTEND_URL: z.url().transform((url) => url.replace(/\/+$/, "")),
});

// Parse and validate process.env against the schema
const parseResult = envSchema.safeParse(process.env);

if (!parseResult.success) {
  console.error(
    "❌ Invalid environment variables:",
    z.treeifyError(parseResult.error)
  );

  throw new Error(
    "Invalid environment variables — see the ❌ log above for which ones."
  );
}

export const env = parseResult.data;