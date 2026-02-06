"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { api } from "@/trpc/react";
import Button from "@/app/components/Button";
import Link from "next/link";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";

function SuccessContent() {
  const searchParams = useSearchParams();
  const payCodeId = searchParams.get("payCodeId");
  const { width, height } = useWindowSize();
  const [showConfetti, setShowConfetti] = useState(true);
  const [redeemed, setRedeemed] = useState(false);
  const [payCodeInfo, setPayCodeInfo] = useState<{
    userName: string;
    domain: string;
  } | null>(null);

  // Find the invoice for this paycode
  const { data: invoiceData, isLoading: invoiceLoading } =
    api.payCode.checkPayment.useQuery(
      { invoiceId: payCodeId || "" },
      {
        enabled: !!payCodeId,
        refetchInterval: (query) =>
          query.state.data?.status === "SETTLED" ? false : 2000,
      }
    );

  // Get paycode details
  const utils = api.useUtils();

  // Redeem mutation
  const redeemMutation = api.payCode.redeemPayCode.useMutation({
    onSuccess: (data) => {
      setRedeemed(true);
      setPayCodeInfo({
        userName: data.userName,
        domain: data.domain,
      });
    },
    onError: (error) => {
      console.error("Failed to redeem:", error);
    },
  });

  // Auto-redeem when payment is settled
  useEffect(() => {
    if (invoiceData?.status === "SETTLED" && payCodeId && !redeemed) {
      redeemMutation.mutate({ invoiceId: payCodeId });
    }
  }, [invoiceData?.status, payCodeId, redeemed]);

  // Hide confetti after a few seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  if (!payCodeId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-4">Invalid Request</h1>
        <p className="text-gray-600 mb-4">No payment information found.</p>
        <Link href="/new">
          <Button>Create a Pay Code</Button>
        </Link>
      </div>
    );
  }

  if (invoiceLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-4">Verifying Payment...</h1>
        <p className="text-gray-600">Please wait while we confirm your payment.</p>
      </div>
    );
  }

  if (invoiceData?.status !== "SETTLED") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-4">Payment Pending</h1>
        <p className="text-gray-600 mb-4">
          Your payment is being processed. This page will update automatically.
        </p>
      </div>
    );
  }

  if (redeemMutation.isPending) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-4">Activating Your Pay Code...</h1>
        <p className="text-gray-600">Almost there!</p>
      </div>
    );
  }

  if (redeemMutation.isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-4 text-red-600">
          Something Went Wrong
        </h1>
        <p className="text-gray-600 mb-4">
          Your payment was received, but we had trouble activating your pay code.
          Please contact support.
        </p>
        <Button onClick={() => redeemMutation.mutate({ invoiceId: payCodeId })}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      {showConfetti && <Confetti width={width} height={height} />}
      <div className="text-6xl mb-4">🎉</div>
      <h1 className="text-3xl font-bold mb-4 text-center">
        Payment Successful!
      </h1>
      {payCodeInfo && (
        <div className="bg-gray-100 rounded-lg p-4 mb-6">
          <p className="text-lg text-center">Your new pay code:</p>
          <p className="text-2xl font-mono font-bold text-center text-blue-600">
            {payCodeInfo.userName}@{payCodeInfo.domain}
          </p>
        </div>
      )}
      <p className="text-gray-600 mb-6 text-center max-w-md">
        Your pay code is now active! You can start receiving Bitcoin payments
        using your new human-readable address.
      </p>
      <div className="flex gap-4">
        <Link href="/new">
          <Button format="secondary">Create Another</Button>
        </Link>
        <Link href="/account">
          <Button>View My Pay Codes</Button>
        </Link>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <h1 className="text-2xl font-bold mb-4">Loading...</h1>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
