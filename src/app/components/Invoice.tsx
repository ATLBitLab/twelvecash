"use client";
import { QRCodeSVG } from "qrcode.react";
import { RouterOutputs, api } from "@/trpc/react";
import { useEffect } from "react";

export default function Invoice({
  paymentInfo,
  onSuccess,
}: {
  paymentInfo: RouterOutputs["payCode"]["createPayCode"];
  onSuccess: () => void;
}) {
  const { data } = api.payCode.checkPayment.useQuery(
    { invoiceId: paymentInfo.invoice.id },
    {
      refetchOnWindowFocus: false,
      refetchInterval: 1500,
    }
  );
  useEffect(() => {
    if (data?.status === "SETTLED") {
      console.debug("should close and mutate");
      // add a state here to stop any potential queries?
      onSuccess();
    }
  }, [data?.status]);
  return (
    <div>
      <QRCodeSVG value={paymentInfo.invoice.bolt11 || ""} />
      <p>{paymentInfo.invoice.bolt11}</p>
    </div>
  );
}
