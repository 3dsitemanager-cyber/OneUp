import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import { AdminUser } from "@/models/AdminUser";
import { adminLoginSchema } from "@/lib/validation";
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";
import { fail, handleRouteError } from "@/lib/api-response";
import { clientIp, rateLimit } from "@/server/rate-limit";

// bcrypt is a native-ish dependency — pin this handler to the Node.js runtime.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** How many wrong passwords an account tolerates before it locks. */
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

/** A valid bcrypt hash of a random value, for the dummy compare below. */
const DUMMY_HASH = "$2a$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

/** POST /api/admin/login — issues the httpOnly admin session cookie. */
export async function POST(request: NextRequest) {
  try {
    // Two independent limits. This one is per-IP and in-memory: cheap, and it
    // stops a single host hammering the endpoint.
    const limit = rateLimit(`login:${await clientIp()}`, 10, 15 * 60 * 1000);
    if (!limit.allowed) {
      return fail("Too many sign-in attempts. Please wait a few minutes.", 429);
    }

    const { email, password } = adminLoginSchema.parse(await request.json());

    await connectToDatabase();
    const admin = await AdminUser.findOne({ email: email.toLowerCase() })
      .select("+passwordHash")
      .exec();

    // Same message and a dummy compare either way, so response timing and wording
    // never reveal whether the email exists.
    if (!admin) {
      await bcrypt.compare(password, DUMMY_HASH);
      return fail("Invalid email or password.", 401);
    }

    // The second limit: per-account, stored in the database. Survives restarts
    // and applies no matter how many addresses the attempts come from.
    //
    // The wording is deliberately generic. "Account locked" would confirm the
    // username exists, which is exactly what an attacker probes for — the only
    // difference a caller can see is that waiting eventually helps.
    if (admin.lockedUntil && admin.lockedUntil.getTime() > Date.now()) {
      // Still burn a compare so a locked account does not answer faster than a
      // live one and become detectable by timing.
      await bcrypt.compare(password, DUMMY_HASH);
      return fail("Too many sign-in attempts. Please wait a few minutes.", 429);
    }

    const valid = await bcrypt.compare(password, admin.passwordHash);

    if (!valid) {
      const failed = (admin.failedAttempts ?? 0) + 1;
      admin.failedAttempts = failed;
      if (failed >= MAX_FAILED_ATTEMPTS) {
        admin.lockedUntil = new Date(Date.now() + LOCKOUT_MS);
        admin.failedAttempts = 0;
      }
      await admin.save();

      // Deliberately the same message as an unknown account: telling an
      // attacker they found a real username is half the work done for them.
      return fail("Invalid email or password.", 401);
    }

    // A good password clears the counter and any expired lock.
    admin.failedAttempts = 0;
    admin.lockedUntil = null;
    admin.lastLoginAt = new Date();
    await admin.save();

    const token = await createSessionToken({
      sub: String(admin._id),
      email: admin.email,
      name: admin.name ?? "Administrator",
      role: "admin",
    });

    const response = NextResponse.json({
      ok: true,
      data: { email: admin.email, name: admin.name ?? "Administrator" },
    });
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
    return response;
  } catch (error) {
    return handleRouteError(error);
  }
}
