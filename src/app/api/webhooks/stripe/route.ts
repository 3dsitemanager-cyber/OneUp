import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { createPaidOrder } from "@/server/create-order";
import { priceCart } from "@/server/pricing";
import { stripe, webhookSecret } from "@/server/stripe";

export const dynamic = "force-dynamic";
// The signature is computed over the raw bytes, so this route must not run on
// an edge/runtime that rewrites the body.
export const runtime = "nodejs";

/**
 * POST /api/webhooks/stripe — the only place an order is ever marked paid.
 *
 * Trust here rests entirely on the signature check: the body is verified
 * against STRIPE_WEBHOOK_SECRET before a single field is read, so a forged
 * request cannot mint orders. Anyone can reach this URL; only Stripe can
 * produce a body that passes.
 *
 * Stripe retries until it receives a 2xx, so every path returns 200 for events
 * that are understood — including ones we deliberately ignore — and 4xx/5xx
 * only when a retry might actually help.
 */
export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ ok: false, error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    // Raw text, not request.json(): re-serialising JSON changes the bytes and
    // invalidates the signature.
    const payload = await request.text();
    event = stripe().webhooks.constructEvent(payload, signature, webhookSecret());
  } catch (error) {
    // A bad signature is not a transient failure — never ask Stripe to retry it.
    const message = error instanceof Error ? error.message : "Invalid signature";
    console.error("[stripe] rejected webhook:", message);
    return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        // `completed` fires for unpaid sessions too (async methods, expiry).
        // Only a paid session may become an order.
        if (session.payment_status !== "paid") break;
        await recordOrder(session);
        break;
      }

      // Async payment methods settle after the session completes.
      case "checkout.session.async_payment_succeeded": {
        await recordOrder(event.data.object);
        break;
      }

      default:
        // Unhandled event types are acknowledged, not retried.
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    // Something on our side failed (database down, say). Ask Stripe to retry.
    console.error("[stripe] failed handling", event.type, error);
    return NextResponse.json({ ok: false, error: "Handler failed" }, { status: 500 });
  }
}

/**
 * Writes the order for a paid session.
 *
 * The cart is re-priced from the catalogue rather than read back from the
 * session, and the result is checked against what Stripe actually collected —
 * so a mismatch is recorded rather than silently fulfilled.
 */
async function recordOrder(session: Stripe.Checkout.Session) {
  const slugs = (session.metadata?.["slugs"] ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (slugs.length === 0) {
    console.error("[stripe] session", session.id, "has no slugs in metadata");
    return;
  }

  const email = session.customer_details?.email ?? session.customer_email;
  if (!email) {
    console.error("[stripe] session", session.id, "has no email");
    return;
  }

  const cart = await priceCart(slugs);

  // Stripe is the authority on what was collected. If it differs from the
  // catalogue price, fulfilling could mean handing over assets that were
  // underpaid — so record it and let an admin look.
  const collected = session.amount_total ?? 0;
  const expected = Math.round(cart.total * 100);
  if (collected !== expected) {
    console.error(
      `[stripe] amount mismatch on ${session.id}: collected ${collected}, expected ${expected}`,
    );
    return;
  }

  const order = await createPaidOrder({
    customerName:
      session.metadata?.["customerName"] ?? session.customer_details?.name ?? "Customer",
    email,
    country: session.metadata?.["country"] ?? session.customer_details?.address?.country ?? "",
    paymentMethod: "card",
    cart,
    stripeSessionId: session.id,
    stripePaymentIntentId:
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : (session.payment_intent?.id ?? undefined),
  });

  console.log(`[stripe] recorded order ${order.orderId} for session ${session.id}`);
}
