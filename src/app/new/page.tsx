import NewPayCodeForm from "@/app/features/NewPayCodeForm";
import { env } from "@/env";

const domains = Object.keys(env.DOMAINS);
const defaultDomain = domains[0] ?? "twelve.cash";

export default function New() {
  return (
    <main className="mx-auto max-w-2xl flex flex-col gap-9 w-full p-2 md:p-6">
      <h1 className="text-center">Create a Pay Code</h1>
      <NewPayCodeForm defaultDomain={defaultDomain} domains={domains} />
    </main>
  );
}
