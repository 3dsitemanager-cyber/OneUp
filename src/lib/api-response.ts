import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { MissingMongoUriError } from "@/lib/mongodb";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

export function fail(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, error: message, ...extra }, { status });
}

/** Single place that turns any thrown value into a safe JSON error response. */
export function handleRouteError(error: unknown) {
  if (error instanceof ZodError) {
    return fail("Validation failed", 422, {
      issues: error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    });
  }

  // A malformed request body makes `request.json()` throw — that is the caller's
  // mistake, not ours, so answer 400 rather than 500.
  if (error instanceof SyntaxError) {
    return fail("Request body is not valid JSON.", 400);
  }

  // Name checks rather than instanceof: keeps this module free of server-only imports.
  if (error instanceof Error && error.name === "UnauthorizedError") {
    return fail("Admin authentication required.", 401);
  }

  if (error instanceof Error && error.name === "UploadRejectedError") {
    return fail(error.message, 422);
  }

  if (error instanceof Error && error.name === "MissingCloudinaryConfigError") {
    console.error(error);
    return fail(error.message, 503);
  }

  if (error instanceof MissingMongoUriError) {
    console.error(error);
    return fail(error.message, 503);
  }

  // Mongo duplicate key
  if (typeof error === "object" && error !== null && "code" in error && error.code === 11000) {
    return fail("That record already exists.", 409);
  }

  console.error(error);
  return fail("Something went wrong on our end.", 500);
}
