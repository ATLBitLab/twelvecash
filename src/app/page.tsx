"use client";
import Input from "./components/Input";
import Button from "./components/Button";
import { useState } from "react";
import Image from "next/image";
import * as doh from '../lib/dnssec-prover/doh_lookup.js';
import {CheckIcon, CrossIcon} from '@bitcoin-design/bitcoin-icons-react/filled'
import CreateForm from "./features/CreateForm";

export default function Home() {
  const [userNameToCheck, setUserNameToCheck] = useState("₿stephen@twelve.cash");
  const [userNameCheck, setUserNameCheck] = useState<any>({});

  const updateUserNameToCheck = (value:string) => {
    setUserNameToCheck(value);
  }

  const deepAlpha = () => {
    alert("this is deep alpha, y'all");
  }

  const checkUserName = (username:string)=>{
      let stripped = username.indexOf("₿") === 0 ? username.split("₿")[1]  : username;
      let name = stripped.split("@")[0];
      let domain = stripped.split("@")[1];
      doh.lookup_doh(`${name}.user._bitcoin-payment.${domain}`, 'TXT', 'https://dns.google/dns-query').then((response)=>{  
        console.log(response);
        setUserNameCheck(JSON.parse(response));
      });
  }

  return (
      <main className="flex flex-col gap-8 max-w-xl lg:w-1/2 lg:pt-24 lg:pl-6">
        <Image
          src="/twelve.png"
          alt=""
          width={1080}
          height={1080}
          sizes="(min-width: 1024px) 800px, (min-width: 1280px) 1080px, 256px"
          className="w-64 h-64 lg:fixed lg:right-[-15%] lg:top-0 lg:w-[800px] lg:h-[800px] xl:w-[1080px] xl:h-[1080px] pointer-events-none"
        />

        {/* Title */}
        <div className="flex flex-col gap-2 relative z-50">
          <h1 className="text-5xl">TwelveCash</h1>
          <p className="text-3xl">A simple way to receive bitcoin<sup className="cursor-pointer" onClick={deepAlpha}>*</sup></p>
        </div>

        <p className="relative z-50">Choose your own user name, give us your bitcoin payment instructions, and share your user name with the world!</p>

        <div className="bg-white p-6 drop-shadow-xl rounded-lg">
          <CreateForm />
        </div>

        <div className="flex flex-col gap-2 pt-4 border-t border-purple-600">
          <h2 className="font-bold">Check a User Name</h2>
          <Input placeholder="₿satoshi@twelve.cash" value={userNameToCheck} onChange={updateUserNameToCheck} />
          <Button text="Validate a Pay Code" format="secondary" onClick={()=>checkUserName(userNameToCheck)} />
          <div className="bg-gray-100 p-2 rounded flex flex-col gap-2 overflow-x-scroll">
            {userNameCheck.valid_from ? userNameCheck.verified_rrs.length === 1 ?
              <h3 className="font-semibold flex flex-row gap-2"><CheckIcon className="w-6 h-6" /> This is a valid user name</h3>
            : 
              <h3 className="font-semibold flex flex-row gap-2"><CrossIcon className="w-6 h-6" /> This is an invalid user name because it has more than one record</h3>
            : userNameCheck.error ?
            <h3 className="font-semibold flex flex-row gap-2"><CrossIcon className="w-6 h-6" /> This is NOT a valid user name</h3>
            : ``}
            <code>
              {JSON.stringify(userNameCheck)}
            </code>
          </div>
        </div>
        
      </main>
  );
}
