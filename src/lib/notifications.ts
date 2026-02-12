/**
 * Activity logging utilities for monitoring pay code registrations.
 * Supports optional webhook notifications.
 */

type PayCodeType = "free" | "paid";

interface ActivityLogOptions {
  type: PayCodeType;
  domain: string;
}

/**
 * Logs pay code registration activity to configured webhook (if set).
 * Privacy-preserving: only logs type and domain, not usernames.
 */
export async function logPayCodeActivity(
  options: ActivityLogOptions
): Promise<void> {
  const webhookUrl = process.env.ACTIVITY_WEBHOOK_URL;

  if (!webhookUrl) {
    // Webhook not configured, skip silently
    return;
  }

  const emoji = options.type === "free" ? "🆓" : "💰";
  const label = options.type === "free" ? "Free" : "Paid";
  const message = `${emoji} ${label} PayCode registered on ${options.domain}`;

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: message,
      }),
    });
  } catch (error) {
    // Log error but don't throw - notifications are non-critical
    console.error("Failed to send activity notification:", error);
  }
}
