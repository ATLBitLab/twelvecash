import Bip353Box from "./components/Bip353Box";
import TwelveCashLogo from "./components/TwelveCashLogo";
import Button from "./components/Button";
import { ArrowRightIcon, SearchIcon } from "@bitcoin-design/bitcoin-icons-react/filled";

export default function Home() {
  const defaultDomain = process.env.DOMAIN ? process.env.DOMAIN : "twelve.cash";
  return (
    <main className="mx-auto max-w-4xl flex flex-col gap-9 w-full text-center p-6">
      <div>
        <TwelveCashLogo size="large" />
      </div>
      <Bip353Box user={'sensible.pangolin'} domain={defaultDomain} />
      <h1 className="max-w-xl mx-auto">A simple way to share your bitcoin payment info with the world.</h1>
      <div className="max-w-md mx-auto flex flex-col gap-6">
        <Button href="/new" size="large">Make a Pay Code <ArrowRightIcon className="w-6 h-6" /></Button>
        <Button href="/search" size="large" format="outline">Check a Pay Code <SearchIcon className="w-6 h-6" /></Button>
      </div>
    </main>
  );
}
