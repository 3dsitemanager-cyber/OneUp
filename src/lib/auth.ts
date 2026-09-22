import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "oneupgaming_admin_session";
// Short enough that a cookie stolen from a shared or unattended machine stops
// working the same day, long enough not to interrupt a working session.
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 4; // 4 hours

export type AdminSession = {
  sub: string;
  email: string;
  name: string;
  role: "admin";
};

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("JWT_SECRET is missing or too short. Set it in .env.local (32+ chars).");
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(session: AdminSession): Promise<string> {
  return new SignJWT({ email: session.email, name: session.name, role: session.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(session.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSecret());
}

/** Returns null instead of throwing so callers can treat any bad token as "logged out". */
export async function verifySessionToken(token: string | undefined): Promise<AdminSession | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: ["HS256"] });
    if (payload.role !== "admin" || typeof payload.sub !== "string") return null;
    return {
      sub: payload.sub,
      email: String(payload["email"] ?? ""),
      name: String(payload["name"] ?? "Administrator"),
      role: "admin",
    };
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  // Not readable from JavaScript, so an XSS bug cannot steal the session.
  httpOnly: true,
  // `strict` rather than `lax`: this cookie is never needed on a cross-site
  // navigation — nothing legitimately links into the admin portal from
  // elsewhere — and it closes the CSRF gap `lax` leaves open on top-level GETs.
  sameSite: "strict" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_MAX_AGE_SECONDS,
};
