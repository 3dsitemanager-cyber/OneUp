import "server-only";

import Stripe from "stripe";

/**
 * The Stripe client, and the two secrets it needs.
 *
 * Both are read lazily rather than at module load: importing this file from a
 * route that only needs `siteUrl` should not crash a deployment that has not
 * finished configuring Stripe yet. Nothing here is ever `NEXT_PUBLIC_` — the
 * secret key and the webhook secret must never reach the browser.
 */

let client: Stripe | null = null;

export function stripe(): Stripe {
  if (client) return client;

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set — add it to .env.local.");
  }
  // A publishable key here would silently fail much later, at the first API call.
  if (!key.startsWith("sk_") && !key.startsWith("rk_")) {
    throw new Error("STRIPE_SECRET_KEY looks wrong: it must start with sk_ or rk_.");
  }

  client = new Stripe(key, { typescript: true });
  return client;
}

/** The signing secret for the webhook endpoint. Required to trust any event. */
export function webhookSecret(): string {
  const value = process.env.STRIPE_WEBHOOK_SECRET;
  if (!value) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not set — add it to .env.local.");
  }
  return value;
}

/** True when Stripe is configured, so callers can degrade instead of throwing. */
export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);
}

/**
 * Absolute base URL for Stripe's success/cancel redirects.
 *
 * Stripe rejects relative URLs, so this must be a real origin in every
 * environment — localhost in development, the live domain in production.
 */
export function siteUrl(): string {
  const value = process.env.NEXT_PUBLIC_SITE_URL;
  if (!value) {
    throw new Error("NEXT_PUBLIC_SITE_URL is not set — Stripe needs an absolute return URL.");
  }
  return value.replace(/\/+$/, "");
}

/** Stripe works in the smallest currency unit; USD prices are stored as dollars. */
export const toMinorUnits = (amount: number) => Math.round(amount * 100);
