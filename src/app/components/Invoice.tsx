"use client";
import { QRCodeSVG } from "qrcode.react";
import { RouterOutputs, api } from "@/trpc/react";
import { useEffect, useState } from "react";
import Button from "./Button";
import { CopyIcon } from "@bitcoin-design/bitcoin-icons-react/filled";

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

  const copyInvoice = () => {
    navigator.clipboard.writeText(paymentInfo.invoice.bolt11 || "");
    copyResponse();
  };

const [copied, setCopied] = useState(false);

  const copyResponse = () => {
    if(copied) return;
    setCopied(true);
    let resetCopied = setTimeout(() => {setCopied(false)}, 3000);
  }
  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white p-4 rounded-md">
        <QRCodeSVG value={paymentInfo.invoice.bolt11 || ""} className="w-full h-auto" />
      </div>
      <div className="flex flex-row gap-4">
        <div onClick={copyInvoice} className="relative w-full border overflow-hidden bg-white p-2 rounded-md flex flex-row items-center font-mono gap-1 cursor-pointer">
          <span className="text-clip overflow-hidden pointer-events-none">
            {paymentInfo.invoice.bolt11}
          </span>
          <span className="pointer-events-none">
            &hellip;
          </span>
          <span className="pointer-events-none">
            {paymentInfo.invoice.bolt11?.slice(paymentInfo.invoice.bolt11.length-4, paymentInfo.invoice.bolt11.length)}
          </span>
          {copied && <span className="pointer-events-none absolute left-0 top-0 w-full h-full backdrop-blur-sm bg-black/30 flex items-center justify-center text-white">Copied!</span>}
        </div>
        <Button size="small" onClick={copyInvoice}><CopyIcon className="w-6 h-6" /></Button>
      </div>
    </div>
  );
}
