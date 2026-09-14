import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { db } from "../src/config/db";
import * as schema from "../src/db/schema";
import { env } from "../src/config/env";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),

  baseURL: process.env.BETTER_AUTH_URL,

  secret: process.env.BETTER_AUTH_SECRET,

  trustedOrigins: [
    env.FRONTEND_URL,
  ],

  emailAndPassword: {
    enabled: true,
  },

  // Frontend and backend live on different sites in production, so the
  // session cookie must be SameSite=None to be sent on cross-site requests.
  // Only applied over HTTPS so local http dev keeps the default cookies.
  ...(env.BETTER_AUTH_URL.startsWith("https://") && {
    advanced: {
      defaultCookieAttributes: {
        sameSite: "none",
        secure: true,
      },
    },
  }),
});