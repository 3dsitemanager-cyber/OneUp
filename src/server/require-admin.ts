import "server-only";

import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken, type AdminSession } from "@/lib/auth";

/** Reads the signed session cookie. Returns null when not signed in. */
export async function getAdminSession(): Promise<AdminSession | null> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

export class UnauthorizedError extends Error {
  constructor() {
    super("Admin authentication required.");
    this.name = "UnauthorizedError";
  }
}

/**
 * Guard for API route handlers. `middleware.ts` already blocks /admin pages,
 * but every mutating route re-checks here so the API is never open on its own.
 */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) throw new UnauthorizedError();
  return session;
}
