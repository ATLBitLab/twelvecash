"use client";
import Button from "@/app/components/Button";
import Input from "@/app/components/InputZ";
import {
    ArrowRightIcon,
    CaretUpIcon,
    CaretDownIcon,
    RefreshIcon,
} from "@bitcoin-design/bitcoin-icons-react/filled";
import InteractionModal from "@/app/components/InteractionModal";
import Invoice from "@/app/components/Invoice";
import type { TwelveCashDomains } from "@/lib/util/constant";
import { useEffect, useState } from "react";
import { RouterOutputs, api } from "@/trpc/react";
import { useZodForm } from "@/lib/util/useZodForm";
import { useRouter } from "next/navigation";
import { RouterInputs } from "@/trpc/react";
import { payCodeInput } from "@/lib/util/constant";

interface NewPayCodeFormProps {
    defaultDomain: TwelveCashDomains;
}

export default function NewPayCodeForm(props: NewPayCodeFormProps) {
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
    },
    onError: (err) => {
      console.error("Failed to create paycode", err);
    },
  });
  const createRandomPaycode = api.payCode.createRandomPayCode.useMutation({
    onSuccess: (data) => {
      console.debug("success data", data);
      router.push(`/new/${data.userName}@${data.domain}`);
    },
    onError: () => {
      console.error("Failed to create paycode");
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
    setValue,
    setError,
    trigger,
    formState: { errors, isDirty, isValid },
  } = useZodForm({
    mode: "onChange",
    schema: payCodeInput,
    defaultValues: {
      domain: props.defaultDomain,
    },
  });

  useEffect(() => {
    if (freeName) {
        console.log("freeName", freeName);
      // hack to allow us to use the same validator for both free and paid
      // this username won't be used in the free api.
      setValue("userName", "hack");
      trigger();
      return;
    }
    setValue("userName", "");
    trigger();
  }, [freeName]);

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
    if (freeName) {
      createRandomPaycode.mutate(data);
      return;
    }
    createPayCode.mutate(data);
  };

    return (
        <div className="flex flex-col gap-9">
            <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row gap-4 md:gap-2 items-center justify-center">
                <Button
                format="outline"
                size="small"
                active={!freeName}
                onClick={() => setFreeName(false)}
                >
                Choose a Name (5,000 sats)
                </Button>
                <Button
                format="outline"
                size="small"
                active={freeName}
                onClick={() => setFreeName(true)}
                >
                Give Me a Random Name (Free)
                </Button>
            </div>
            {!freeName && (
                <Input
                name="userName"
                label="Choose a User Name"
                description={
                    errors.userName ? errors.userName.message : "Pick your user name!"
                }
                placeholder="satoshi"
                register={register}
                append={`@${props.defaultDomain}`}
                />
            )}
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
            label="LNURL Pay"
            description={
                errors.lnurl
                ? errors.lnurl.message
                : "You can add in LNURL information for services that do not support these other methods."
            }
            placeholder="lnurl123...xyz"
            hidden={!optionsExpanded}
            register={register}
            />
            <div className="flex flex-col md:flex-row gap-4 justify-between">
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
            <InteractionModal
                title="Pay for User Name"
                close={() => setPaymentInfo(null)}
            >
                <div className="flex flex-row justify-between items-center mb-4">
                <p className="text-center text-2xl mb-0 font-semibold">
                    5,000 sats
                </p>
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
        </div>
    )
}