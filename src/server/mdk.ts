/**
 * Money Dev Kit integration for Lightning payments
 *
 * The MDK checkout flow is now handled by the @moneydevkit/nextjs SDK:
 * - Client: useCheckout() hook creates checkouts via POST to /api/mdk
 * - Checkout page: /checkout/[id] renders the <Checkout> component
 * - Route handler: /api/mdk/[[...mdk]]/route.ts handles API requests
 * - Success: useCheckoutSuccess() verifies payment on success page
 *
 * See https://docs.moneydevkit.com/mdk-checkout for documentation.
 */
