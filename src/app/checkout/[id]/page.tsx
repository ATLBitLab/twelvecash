"use client";
import { Checkout } from "@moneydevkit/nextjs";

export default function CheckoutPage({
  params,
}: {
  params: { id: string };
}) {
  return <Checkout id={params.id} />;
}
