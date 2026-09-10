import { NextRequest } from "next/server";
import { checkoutSessionSchema } from "@/lib/validation";
import { fail, handleRouteError, ok } from "@/lib/api-response";
import { CartPricingError, priceCart } from "@/server/pricing";
import { clientIp, rateLimit } from "@/server/rate-limit";
import { siteUrl, stripe, stripeConfigured, toMinorUnits } from "@/server/stripe";

export const dynamic = "force-dynamic";

/**
 * POST /api/checkout — starts a Stripe Checkout session.
 *
 * This route never records an order. It prices the cart, hands Stripe the
 * amount to collect, and returns the hosted payment URL. The order is written
 * only when Stripe confirms payment, in the webhook — so abandoning this page,
 * or calling this endpoint directly, cannot produce a paid order.
 */
export async function POST(request: NextRequest) {
  try {
    if (!stripeConfigured()) {
      return fail("Payments are not configured yet. Please try again later.", 503);
    }

    // Each call creates a Stripe session; without a cap this is a free way to
    // fill the dashboard with junk and burn API quota.
    const limit = rateLimit(`checkout:${await clientIp()}`, 20, 10 * 60 * 1000);
    if (!limit.allowed) {
      return fail("Too many checkout attempts. Please wait a few minutes.", 429);
    }

    const body = checkoutSessionSchema.parse(await request.json());

    // Prices come from MongoDB, never from the request body.
    const cart = await priceCart(body.slugs);
    if (cart.total <= 0) {
      return fail("That cart total is not payable.", 400);
    }

    const email = body.email.toLowerCase();

    // The discount is folded into the line items so Stripe's total always
    // matches ours: each line is charged at its share of the discounted total,
    // with any rounding remainder placed on the first line.
    const lineTotals = splitDiscount(
      cart.items.map((i) => toMinorUnits(i.price)),
      toMinorUnits(cart.total),
    );

    const session = await stripe().checkout.sessions.create({
      mode: "payment",
      customer_email: email,
      line_items: cart.items.map((item, index) => ({
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: lineTotals[index] ?? toMinorUnits(item.price),
          product_data: {
            name: item.name,
            ...(item.category ? { description: item.category } : {}),
            // Stripe rejects anything that isn't a public absolute URL.
            ...(/^https?:\/\//.test(item.image) ? { images: [item.image] } : {}),
          },
        },
      })),
      // Everything the webhook needs to write the order, carried by Stripe so
      // this server holds no pending-checkout state of its own.
      metadata: {
        customerName: body.customerName,
        country: body.country ?? "",
        slugs: body.slugs.join(","),
      },
      success_url: `${siteUrl()}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl()}/checkout?cancelled=1`,
      // Digital goods: no shipping, and an emailed receipt from Stripe.
      billing_address_collection: "auto",
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    });

    if (!session.url) {
      return fail("Stripe did not return a payment link. Please try again.", 502);
    }

    return ok({ url: session.url, sessionId: session.id }, { status: 201 });
  } catch (error) {
    if (error instanceof CartPricingError) return fail(error.message, 409);
    return handleRouteError(error);
  }
}

/**
 * Spreads a cart-level discount across line items in minor units.
 *
 * Stripe totals its own lines, so the discount cannot be a separate figure —
 * it has to live inside the per-line prices, and those must still add up to
 * exactly the total we quoted the buyer.
 */
function splitDiscount(lines: number[], target: number): number[] {
  const gross = lines.reduce((sum, n) => sum + n, 0);
  if (gross <= 0 || target >= gross) return lines;

  const scaled = lines.map((n) => Math.floor((n * target) / gross));
  const remainder = target - scaled.reduce((sum, n) => sum + n, 0);
  if (remainder > 0 && scaled.length > 0) scaled[0] = (scaled[0] ?? 0) + remainder;
  return scaled;
}
