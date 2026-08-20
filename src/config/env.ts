import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(8080),
  DATABASE_URL: z.url(),
});

// Parse and validate process.env against the schema
const parseResult = envSchema.safeParse(process.env);

if (!parseResult.success) {
  console.error(
    "❌ Invalid environment variables:",
    z.treeifyError(parseResult.error)
  );
  process.exit(1);
}

export const env = parseResult.data;