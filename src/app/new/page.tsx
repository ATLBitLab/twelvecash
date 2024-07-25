"use client";
import { useState } from "react";
import Button from "@/app/components/Button";
import Input from "@/app/components/InputZ";
import { useZodForm } from "@/lib/util/useZodForm";
import {
  ArrowRightIcon,
  CaretUpIcon,
  CaretDownIcon,
  RefreshIcon
} from "@bitcoin-design/bitcoin-icons-react/filled";
import { useRouter } from "next/navigation";
import { RouterOutputs, api } from "@/trpc/react";
import { RouterInputs } from "@/trpc/react";
import { payCodeInput } from "@/lib/util/constant";
import InteractionModal from "@/app/components/InteractionModal";
import Invoice from "@/app/components/Invoice";

export default function New() {
  const [optionsExpanded, setOptionsExpanded] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<
    RouterOutputs["payCode"]["createPayCode"] | null
  >(null);
  const [freeName, setFreeName] = useState(false);
  const router = useRouter();
  const createPayCode = api.payCode.createPayCode.useMutation({
    onSuccess: (data) => {
      console.debug("success data", data);
      setPaymentInfo(data);
      //   router.push(`/new/${data.userName}@${data.domain}`);
    },
    onError: (err) => {
      console.error("Failed to create paycode", err);
    },
  });
  const redeemPayCode = api.payCode.redeemPayCode.useMutation({
    onSuccess: (payCode) => {
      // setPaymentInfo null?
      setPaymentInfo(null);
      console.debug("redeem success!", payCode);
      router.push(`/new/${payCode.userName}@${payCode.domain}`);
    },
    onError: (err) => {
      setPaymentInfo(null);
      console.error("Failed to redeem paycode... sorry", err);
    },
  });

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isDirty, isValid },
  } = useZodForm({
    mode: "onChange",
    schema: payCodeInput,
    defaultValues: {
      // domain: "twelve.cash",
      domain: "12cash.dev",
    },
  });

  const createPaycode = async (
    data: RouterInputs["payCode"]["createPayCode"]
  ) => {
    if (!data.lno && !data.sp && !data.onChain && !data.lnurl) {
      console.error("At least one payment option must be provided.");
      setError("lno", {
        message: "At least one payment option must be provided.",
      });
      return;
    }
    // TODO: convert ln address to lnurl
    createPayCode.mutate(data);
  };

  return (
    <main className="mx-auto max-w-2xl flex flex-col gap-9 w-full p-6">
      <h1 className="text-center">Create a Pay Code</h1>
      <div className="flex flex-col gap-6">
        <div className="flex flex-row gap-2 items-center justify-center">
          <Button format="outline" size="small" active={!freeName} onClick={()=>setFreeName(!freeName)}>
            Choose a Name (1000 sats)
          </Button>
          <Button format="outline" size="small" active={freeName} onClick={()=>setFreeName(!freeName)}>
            Give Me a Random Name (Free)
          </Button>
        </div>
        {!freeName && 
          <Input
            name="userName"
            label="Choose a User Name"
            description={
              errors.userName ? errors.userName.message : "Pick your user name!"
            }
            placeholder="satoshi"
            register={register}
            append={`@12cash.dev`}
          />
        }
      </div>
      <Input
        name="lno"
        label="BOLT 12 Offer"
        description={
          errors.lno ? errors.lno.message : "Learn more at BOLT12.org"
        }
        placeholder="lno123...xyz"
        register={register}
      />
      <Input
        name="sp"
        label="Silent Payments address"
        description={
          errors.sp ? errors.sp.message : "Learn more at silentpayments.xyz"
        }
        placeholder="sp123...xyz"
        register={register}
      />
      <Input
        name="onChain"
        label="Onchain Address"
        description={
          errors.onChain
            ? errors.onChain.message
            : "Address re-use is discouraged for privacy. Consider using a silent payment address instead."
        }
        placeholder="bc123...xyz"
        hidden={!optionsExpanded}
        register={register}
      />
      <Input
        name="label"
        label="Label"
        description={
          errors.label
            ? errors.label.message
            : "Not all wallets support this. It allows a payee to categorize an address with a name."
        }
        placeholder="Your Name / Nym"
        hidden={!optionsExpanded}
        register={register}
      />
      <Input
        name="lnurl"
        label="LNURL Pay (or Lightning Address)"
        description={
          errors.lnurl
            ? errors.lnurl.message
            : "You can add in LNURL information for services that do not support these other methods."
        }
        placeholder="lnurl123...xyz / user@strike.me"
        hidden={!optionsExpanded}
        register={register}
      />
      <div className="flex justify-between">
        <Button
          format="secondary"
          onClick={() => setOptionsExpanded(!optionsExpanded)}
        >
          {optionsExpanded ? (
            <>
              Less Options <CaretUpIcon className="w-6 h-6" />
            </>
          ) : (
            <>
              More Options <CaretDownIcon className="w-6 h-6" />
            </>
          )}
        </Button>
        <Button
          disabled={!isDirty || !isValid}
          onClick={handleSubmit(createPaycode)}
        >
          Create Pay Code <ArrowRightIcon className="w-6 h-6" />{" "}
        </Button>
      </div>
      {paymentInfo && (
        <InteractionModal title="Pay for User Name" close={() => setPaymentInfo(null)}>
          <div className="flex flex-row justify-between items-center mb-4">
            <p className="text-center text-2xl mb-0 font-semibold">1,000 sats</p>
            <div className="flex flex-row gap-1 items-center justify-end font-bold">
              Awaiting Payment <RefreshIcon className="w-6 h-6 animate-spin" />
            </div>
          </div>
          <Invoice
            paymentInfo={paymentInfo}
            onSuccess={() =>
              redeemPayCode.mutate({ invoiceId: paymentInfo.invoice.id })
            }
          />
        </InteractionModal>
      )}
    </main>
  );
}
