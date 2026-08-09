// Work around a Next.js production bundling issue with `ws` optional native
// helpers (`bufferutil` / `utf-8-validate`) that can crash MDK requests on
// Vercel with `TypeError: ...mask is not a function`. These must be set before
// the MDK module (which pulls in `ws` and the `lightning-js` napi binary) is
// loaded — a static `import` would hoist above these assignments, so the module
// is loaded lazily via require() in getMdk() below.
process.env.WS_NO_BUFFER_UTIL = "1";
process.env.WS_NO_UTF_8_VALIDATE = "1";

import { PAY_CODE_PRICE_SATS } from "@/lib/util/constant";

// Minimal local types for the fields we consume. Checkout statuses:
// UNCONFIRMED | CONFIRMED | PENDING_PAYMENT | PAYMENT_RECEIVED | EXPIRED.
export interface MdkCheckout {
  id: string;
  status: string;
  invoice: { amountSatsReceived?: number | null } | null;
}

export interface CreateMdkCheckoutParams {
  type: "AMOUNT";
  amount: number;
  currency: "SAT";
  title: string;
  description: string;
  successUrl: string;
  metadata: Record<string, string>;
}

type MdkModule = {
  createCheckout(params: CreateMdkCheckoutParams): Promise<{
    data?: { checkout: MdkCheckout };
    error?: { message: string };
  }>;
  getCheckout(checkoutId: string): Promise<MdkCheckout>;
};

let mdk: MdkModule | undefined;
function getMdk(): MdkModule {
  // Lazy + memoized: the napi lightning binary only loads when a paid-tier
  // procedure actually runs, not on every tRPC cold start.
  if (!mdk) {
    mdk = require("@moneydevkit/core") as MdkModule;
  }
  return mdk;
}

export async function createMdkCheckout(
  params: CreateMdkCheckoutParams
): Promise<MdkCheckout> {
  const result = await getMdk().createCheckout(params);
  if (result.error || !result.data?.checkout) {
    throw new Error(result.error?.message ?? "MDK returned no checkout");
  }
  return result.data.checkout;
}

export async function getMdkCheckout(checkoutId: string): Promise<MdkCheckout> {
  return getMdk().getCheckout(checkoutId);
}

/**
 * Pure predicate: has this checkout been paid in full? Fail-closed — an
 * unprovable amount (missing invoice) returns false. Kept free of any MDK
 * import so it is unit-testable without MDK credentials.
 */
export function isCheckoutPaid(
  checkout: Pick<MdkCheckout, "status" | "invoice">,
  requiredSats: number = PAY_CODE_PRICE_SATS
): boolean {
  const received = checkout.invoice?.amountSatsReceived ?? 0;
  const paid = checkout.status === "PAYMENT_RECEIVED" || received > 0;
  return paid && received >= requiredSats;
}
