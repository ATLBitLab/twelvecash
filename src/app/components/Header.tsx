"use client";
import {
  PlusIcon,
  SearchIcon,
  WalletIcon,
  ContactsIcon,
  MenuIcon
} from "@bitcoin-design/bitcoin-icons-react/filled";
import { useState } from "react";
import Button from "./Button";
import TwelveCashLogo from "./TwelveCashLogo";
import { useUser } from "./ClientUserProvider";

export default function Header() {
  const user = useUser();
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className="border-b border-b-white/40 p-5 flex flex-wrap justify-between items-center gap-4 flex-row sticky top-0 backdrop-blur-2xl">
      <div className="flex flex-col items-center">
        <div className="scale-75 origin-left sm:scale-100">
          <TwelveCashLogo />
        </div>
      </div>
      <Button size="medium" format="free" onClick={()=>{setMenuOpen(!menuOpen)}} className="sm:hidden">
        <span className="sr-only">Show Menu</span> <MenuIcon className="w-8 h-8" />
      </Button>
      <nav className={`${!menuOpen ? 'max-sm:hidden ': ''} flex flex-col items-end max-sm:w-full sm:items-center gap-2 justify-end sm:flex-row`}>
        <Button href="/search" size="medium" format="free">
          Check <SearchIcon className="w-6 h-6" />
        </Button>
        <Button href="/new" size="medium" format="free">
          New <PlusIcon className="w-6 h-6" />
        </Button>
        {user.user ? (
          <Button href="/account" size="medium" format="free">
            Account
            <WalletIcon className="w-6 h-6" />
          </Button>
        ) : (
          <Button href="/auth" size="medium" format="free">
            Login <ContactsIcon className="w-6 h-6" />
          </Button>
        )}
      </nav>
      
    </header>
  );
}
