import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Download links are stateless: instead of storing a token per order, the link
 * carries `orderId.expiry.signature`, signed with JWT_SECRET. Nothing can be
 * forged without the secret, and an expired link stops working on its own.
 *
 * Kept deliberately separate from the admin session in lib/auth.ts — a download
 * link grants one order's files, never admin access.
 */

/** How long an issued link stays valid. */
export const DOWNLOAD_TTL_MS = 24 * 60 * 60 * 1000;

function secret(): string {
  const value = process.env.JWT_SECRET;
  if (!value || value.length < 16) {
    throw new Error("JWT_SECRET must be set in .env.local to issue download links.");
  }
  return value;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

/** Builds a signed token for one order, valid for DOWNLOAD_TTL_MS. */
export function createDownloadToken(orderId: string, ttlMs = DOWNLOAD_TTL_MS): string {
  const payload = `${orderId.toUpperCase()}.${Date.now() + ttlMs}`;
  return `${payload}.${sign(payload)}`;
}

export type VerifiedToken =
  | { ok: true; orderId: string }
  | { ok: false; reason: "malformed" | "expired" | "invalid" };

/** Verifies a token and returns the order it grants access to. */
export function verifyDownloadToken(token: string): VerifiedToken {
  const parts = token.split(".");
  if (parts.length !== 3) return { ok: false, reason: "malformed" };

  const [orderId, expiry, signature] = parts as [string, string, string];
  const expected = sign(`${orderId}.${expiry}`);

  // Constant-time compare so a wrong signature leaks no timing information.
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, reason: "invalid" };
  }

  const expiresAt = Number(expiry);
  if (!Number.isFinite(expiresAt)) return { ok: false, reason: "malformed" };
  if (Date.now() > expiresAt) return { ok: false, reason: "expired" };

  return { ok: true, orderId };
}
