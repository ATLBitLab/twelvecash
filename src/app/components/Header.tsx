"use client";
import {
  KeyIcon,
  PlusIcon,
  SearchIcon,
  WalletIcon,
} from "@bitcoin-design/bitcoin-icons-react/filled";
import Button from "./Button";
import TwelveCashLogo from "./TwelveCashLogo";
import { useUser } from "./ClientUserProvider";

export default function Header() {
  const user = useUser();
  return (
    <header className="border-b border-b-white/40 p-5 flex justify-between items-center gap-4 flex-row sticky top-0 backdrop-blur-2xl">
      <div className="flex flex-col items-center">
        <div className="scale-75 origin-left sm:scale-100">
          <TwelveCashLogo />
        </div>
      </div>
      <nav className="w-full flex flex-row items-center gap-2 justify-end sm:hidden">
        <Button href="/search" size="small" format="secondary">
          Check <SearchIcon className="w-6 h-6" />
        </Button>
        <Button href="/new" size="small">
          New <PlusIcon className="w-6 h-6" />
        </Button>
        {user.user ? (
          <Button href="/account" size="small">
            Account
            <WalletIcon className="w-6 h-6" />
          </Button>
        ) : (
          <Button href="/auth" size="small">
            Auth <KeyIcon className="w-6 h-6" />
          </Button>
        )}
      </nav>
      <nav className="w-full flex-row items-center gap-2 justify-end hidden sm:flex">
        <Button href="/search" size="medium" format="secondary">
          Check <SearchIcon className="w-6 h-6" />
        </Button>
        <Button href="/new" size="medium">
          New <PlusIcon className="w-6 h-6" />
        </Button>
        {user.user ? (
          <Button href="/account" size="medium">
            Account
            <WalletIcon className="w-6 h-6" />
          </Button>
        ) : (
          <Button href="/auth" size="medium">
            Auth <KeyIcon className="w-6 h-6" />
          </Button>
        )}
      </nav>
    </header>
  );
}
