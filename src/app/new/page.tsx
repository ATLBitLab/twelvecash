"use client";
import { useState } from "react";
import Button from "../components/Button";
import Input from "../components/Input";
import {
  ArrowRightIcon,
  CaretUpIcon,
  CaretDownIcon,
} from "@bitcoin-design/bitcoin-icons-react/filled";

export default function New() {
  const [optionsExpanded, setOptionsExpanded] = useState(false);
  return (
    <main className="mx-auto max-w-2xl flex flex-col gap-9 w-full p-6">
      <h1 className="text-center">Paste Your Payment Info Below</h1>
      <Input label="Bolt12 Offer" description="Learn more at BOLT12.org" />
      <Input
        label="Silent Payments address"
        description="Learn more at silentpayments.xyz"
      />
      {optionsExpanded && (
        <>
          <Input
            label="Onchain Address"
            description="Address re-use is discouraged for privacy. Consider using a silent payment address instead."
          />
          <Input
            label="Label"
            description="Not all wallets support this. It allows a payee to categorize an address with a name."
          />
          <Input
            label="LNURL Pay (or Lightning Address)"
            description="You can add in LNURL information for services that do not support these other methods."
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
        <Button>
          Create Pay Code <ArrowRightIcon className="w-6 h-6" />{" "}
        </Button>
      </div>
    </main>
  );
}
