import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import { AdminUser } from "@/models/AdminUser";
import { adminLoginSchema } from "@/lib/validation";
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";
import { fail, handleRouteError } from "@/lib/api-response";

// bcrypt is a native-ish dependency — pin this handler to the Node.js runtime.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST /api/admin/login — issues the httpOnly admin session cookie. */
export async function POST(request: NextRequest) {
  try {
    const { email, password } = adminLoginSchema.parse(await request.json());

    await connectToDatabase();
    const admin = await AdminUser.findOne({ email: email.toLowerCase() })
      .select("+passwordHash")
      .exec();

    // Same message and a dummy compare either way, so response timing and wording
    // never reveal whether the email exists.
    if (!admin) {
      await bcrypt.compare(password, "$2b$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalid");
      return fail("Invalid email or password.", 401);
    }

    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) return fail("Invalid email or password.", 401);

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
