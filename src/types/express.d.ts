import type { auth } from "../../lib/auth";

declare global {
  namespace Express {
    interface Locals {
      session: Awaited<
        ReturnType<typeof auth.api.getSession>
      >;

      user: NonNullable<
        Awaited<
          ReturnType<typeof auth.api.getSession>
        >
      >["user"];
    }
  }
}

export {};