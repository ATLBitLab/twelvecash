"use client";
import { useState } from "react";
import Button from "../components/Button";
import Input from "../components/InputZ";
import { useZodForm } from "@/lib/util/useZodForm";
import {
  ArrowRightIcon,
  CaretUpIcon,
  CaretDownIcon,
} from "@bitcoin-design/bitcoin-icons-react/filled";
import { z } from "zod";
import { useRouter } from "next/navigation";

export default function New() {
  const [optionsExpanded, setOptionsExpanded] = useState(false);
  // const [bip353, setBip353] = useState<string>("");
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isDirty },
  } = useZodForm({
    mode: "onSubmit",
    schema: z.object({
      lno: z
        .union([z.string().startsWith("lno"), z.string().length(0)])
        .optional(),
      sp: z
        .union([z.string().startsWith("sp"), z.string().length(0)])
        .optional(),
      onChain: z.string().optional(),
      label: z.string().optional(),
      lnurl: z.string().optional(),
      domain: z.string(),
    }),
    defaultValues: {
      domain: "12cash.dev",
    },
  });

  const createPaycode = async (data: any) => {
    if (!data.lno && !data.sp && !data.onChain && !data.lnurl) {
      setError("lno", {
        message: "At least one payment option must be provided.",
      });
      return;
    }
    console.debug("data", data);
    try {
      const res = await fetch("/v2/record", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      router.push(`/${json.bip353}`);
    } catch (e: any) {
      console.error(e);
    }
  };

  return (
    <main className="mx-auto max-w-2xl flex flex-col gap-9 w-full p-6">
      <h1 className="text-center">Paste Your Payment Info Below</h1>
      <Input
        name="lno"
        label="Bolt12 Offer"
        description="Learn more at BOLT12.org"
        placeholder="lno123...xyz"
        register={register}
      />
      <Input
        name="sp"
        label="Silent Payments address"
        description="Learn more at silentpayments.xyz"
        placeholder="sp123...xyz"
        register={register}
      />
      {optionsExpanded && (
        <>
          <Input
            name="onChain"
            label="Onchain Address"
            description="Address re-use is discouraged for privacy. Consider using a silent payment address instead."
            placeholder="bc123...xyz"
            register={register}
          />
          <Input
            name="label"
            label="Label"
            description="Not all wallets support this. It allows a payee to categorize an address with a name."
            placeholder="Your Name / Nym"
            register={register}
          />
          <Input
            name="lnurl"
            label="LNURL Pay (or Lightning Address)"
            description="You can add in LNURL information for services that do not support these other methods."
            placeholder="lnurl123...xyz"
            register={register}
          />
        </>
      )}
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
        <Button onClick={handleSubmit(createPaycode)}>
          Create Pay Code <ArrowRightIcon className="w-6 h-6" />{" "}
        </Button>
      </div>
    </main>
  );
}
