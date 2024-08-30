import NewPayCodeForm from "@/app/features/NewPayCodeForm";
import { DOMAINS } from "@/lib/util/constant";
import type { TwelveCashDomains } from "@/lib/util/constant";
import { env } from "@/env";

const getDefaultDomain = (): TwelveCashDomains => {
  const domain = Object.keys(env.DOMAINS)[0] as TwelveCashDomains;
  return DOMAINS.includes(domain) ? domain : "12cash.dev";
};

const defaultDomain = getDefaultDomain();

export default function New() {

  return (
    <main className="mx-auto max-w-2xl flex flex-col gap-9 w-full p-2 md:p-6">
      <h1 className="text-center">Create a Pay Code</h1>
      <NewPayCodeForm defaultDomain={defaultDomain} />
    </main>
  );
}
