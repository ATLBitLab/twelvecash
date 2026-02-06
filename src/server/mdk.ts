/**
 * Money Dev Kit integration for Lightning payments
 * Replaces the direct LND integration with MDK's checkout flow
 */

export interface CheckoutResult {
  checkoutUrl: string;
  checkoutId: string;
}

const MDK_API_BASE = "https://api.moneydevkit.com/v1";

/**
 * Create a Money Dev Kit checkout session for purchasing a pay code
 * @param amountSats - Amount in satoshis
 * @param payCodeId - The paycode ID to associate with this checkout
 * @param description - Description for the checkout
 * @returns Checkout URL and session ID
 */
export async function createPayCodeCheckout(
  amountSats: number,
  payCodeId: string,
  description: string
): Promise<CheckoutResult> {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");

  const accessToken = process.env.MDK_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error("MDK_ACCESS_TOKEN is not configured");
  }

  // Create checkout via MDK API
  const response = await fetch(`${MDK_API_BASE}/checkouts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      type: "AMOUNT",
      title: "Purchase Pay Code",
      description: description,
      amount: amountSats,
      currency: "SAT",
      successUrl: `${baseUrl}/new/success?payCodeId=${payCodeId}`,
      metadata: {
        payCodeId: payCodeId,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("MDK checkout creation failed:", errorText);
    throw new Error(`Failed to create checkout: ${response.statusText}`);
  }

  const result = await response.json();

  // MDK returns the checkout with an id - we construct the checkout URL
  const checkoutId = result.id || result.checkout?.id;
  if (!checkoutId) {
    throw new Error("No checkout ID returned from MDK");
  }

  // The checkout URL is typically hosted on MDK
  const checkoutUrl = `https://checkout.moneydevkit.com/${checkoutId}`;

  return {
    checkoutUrl,
    checkoutId,
  };
}

/**
 * Verify a checkout was paid
 * @param checkoutId - The checkout session ID
 * @returns Whether the checkout was successfully paid
 */
export async function verifyCheckoutPaid(checkoutId: string): Promise<boolean> {
  const accessToken = process.env.MDK_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error("MDK_ACCESS_TOKEN is not configured");
  }

  const response = await fetch(`${MDK_API_BASE}/checkouts/${checkoutId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    console.error("Failed to verify checkout:", await response.text());
    return false;
  }

  const checkout = await response.json();
  // MDK checkout status values: PENDING, PAID, EXPIRED, CANCELLED
  return checkout.status === "PAID";
}
