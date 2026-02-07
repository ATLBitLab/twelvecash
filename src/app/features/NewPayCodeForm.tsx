"use client";
import Button from "@/app/components/Button";
import Input from "@/app/components/InputZ";
import {
    ArrowRightIcon,
    CaretUpIcon,
    CaretDownIcon,
} from "@bitcoin-design/bitcoin-icons-react/filled";
import type { TwelveCashDomains } from "@/lib/util/constant";
import { useEffect, useState } from "react";
import { api } from "@/trpc/react";
import { useZodForm } from "@/lib/util/useZodForm";
import { useRouter } from "next/navigation";
import { RouterInputs } from "@/trpc/react";
import { payCodeInput } from "@/lib/util/constant";
import { useCheckout } from "@moneydevkit/nextjs";

interface NewPayCodeFormProps {
    defaultDomain: TwelveCashDomains;
}

export default function NewPayCodeForm(props: NewPayCodeFormProps) {
    const [optionsExpanded, setOptionsExpanded] = useState(false);
    const [freeName, setFreeName] = useState(false);
    const [checkoutError, setCheckoutError] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    const router = useRouter();
    const { createCheckout, isLoading: isCheckoutLoading } = useCheckout();

  const createPayCode = api.payCode.createPayCode.useMutation({
    onSuccess: async (data) => {
      console.debug("PayCode created, creating MDK checkout...", data);
      setCheckoutError(null);

      // Create an MDK checkout for the pay code purchase
      const result = await createCheckout({
        type: "AMOUNT",
        amount: 5000,
        currency: "SAT",
        title: "Purchase Pay Code",
        description: `Purchase pay code: ${data.userName}@${data.domain}`,
        successUrl: `/new/success?payCodeId=${data.payCodeId}`,
        metadata: {
          payCodeId: data.payCodeId,
          userName: data.userName,
          domain: data.domain,
        },
      });

      if (result.error) {
        console.error("MDK checkout failed:", result.error);
        setCheckoutError(result.error.message);
        setIsCreating(false);
        return;
      }

      // Redirect to MDK checkout page
      window.location.href = result.data.checkoutUrl;
    },
    onError: (err) => {
      console.error("Failed to create paycode", err);
      setIsCreating(false);
      if (err.data?.code === "CONFLICT") {
        setError("userName", { message: err.message });
      } else {
        setCheckoutError(err.message);
      }
    },
  });
  const createRandomPaycode = api.payCode.createRandomPayCode.useMutation({
    onSuccess: (data) => {
      console.debug("success data", data);
      router.push(`/new/${data.userName}@${data.domain}`);
    },
    onError: () => {
      console.error("Failed to create paycode");
      setIsCreating(false);
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    trigger,
    formState: { errors, isDirty, isValid, dirtyFields },
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
    setIsCreating(true);
    setCheckoutError(null);
    if (freeName) {
      createRandomPaycode.mutate(data);
      return;
    }
    createPayCode.mutate(data);
  };

  const isBusy = isCreating || createPayCode.isPending || isCheckoutLoading;

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
                    errors.userName && dirtyFields.userName ? errors.userName.message : "Pick your user name!"
                }
                error={!!errors.userName && !!dirtyFields.userName}
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
            error={!!errors.lno}
            placeholder="lno123...xyz"
            register={register}
            />
            <Input
            name="sp"
            label="Silent Payments address"
            description={
                errors.sp ? errors.sp.message : "Learn more at silentpayments.xyz"
            }
            error={!!errors.sp}
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
            error={!!errors.onChain}
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
            error={!!errors.label}
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
            error={!!errors.lnurl}
            placeholder="lnurl123...xyz"
            hidden={!optionsExpanded}
            register={register}
            />
            {checkoutError && (
                <p className="text-red-500 text-sm">
                    Failed to create checkout: {checkoutError}
                </p>
            )}
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
                disabled={!isDirty || !isValid || isBusy}
                onClick={handleSubmit(createPaycode)}
            >
                {isBusy ? (
                    "Creating..."
                ) : (
                    <>
                        Create Pay Code <ArrowRightIcon className="w-6 h-6" />
                    </>
                )}
            </Button>
            </div>
        </div>
    )
}