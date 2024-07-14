"use client";
import Input from "./components/Input";
import Button from "./components/Button";
import { useState } from "react";
import Image from "next/image";
import * as doh from '../lib/dnssec-prover/doh_lookup.js';
import {CheckIcon, CrossIcon} from '@bitcoin-design/bitcoin-icons-react/filled'


export default function Home() {
  const createRecord = async () => {
    const res = await fetch("/record", {
      method: "POST",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ localPart: newUserName, bolt12: newOffer })
    });
    const json = await res.json();
    console.debug("json", json);
    if(json.error) {
      setShowSuccess(false);
      setFailureMessage(defaultFailureMessage);
    }
    else if(json.message === "Bolt12 Address Created") {
      setShowSuccess(true);
    }
    else if (json.message === "Name is taken.") {
      setShowSuccess(false);
      setFailureMessage("This user name is already taken. Please try another one.");
    }
  };

  const defaultFailureMessage = "Tbh, we're not sure.";

  const [newUserName, setUserName] = useState("");
  const [newOffer, setOffer] = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  const [showInfo, setShowInfo] = useState(false);
  const [showSuccess, setShowSuccess] = useState<boolean|null>(null);
  const [failureMessage, setFailureMessage] = useState(defaultFailureMessage);
  const [userNameToCheck, setUserNameToCheck] = useState("₿stephen@twelve.cash");
  const [userNameCheck, setUserNameCheck] = useState<any>({});

  const updateUserName = (value:string) => {
    setUserName(value);
  }

  const updateUserNameToCheck = (value:string) => {
    setUserNameToCheck(value);
  }

  const updateOffer = (value:string) => {
    setOffer(value);
  }

  const deepAlpha = () => {
    alert("this is deep alpha, y'all");
  }

  const startOver = () => {
    setCurrentStep(0);
    setUserName("");
    setOffer("");
    setShowInfo(false);
    setShowSuccess(null);
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
        
        {currentStep === 0 ?
          <div className="flex flex-col gap-2 relative z-50">
            <h2 className="font-bold">1. Choose a User Name</h2>

            <Input placeholder="satoshi" prepend="₿" append="@twelve.cash" value={newUserName} onChange={updateUserName} />

            <Button text="Continue" format="primary" disabled={newUserName === ""} onClick={()=>setCurrentStep(1)}  />
          </div>
        : currentStep === 1 ?
          <div className="flex flex-col gap-2">
            <h2 className="font-bold">2. Bitcoin Payment Instructions</h2>

            <p>This should be a BOLT 12 offer from a compatible wallet or lightning node.</p>

            <Input placeholder="lno1..." value={newOffer} onChange={updateOffer} />

            <div className="flex flex-row gap-2 items-center justify-end">
              <Button text="Back" format="secondary" onClick={()=>setCurrentStep(0)}  />
              <Button text="Finish" format="primary" onClick={()=>{createRecord(); setCurrentStep(2);}}  />
            </div>
          </div>
        : currentStep === 2 ?
          <div className="flex flex-col gap-2 bg-white rounded p-4">
            {showSuccess === true ?
              <>
                <h2 className="text-2xl font-semibold w-full hyphens-auto text-center">{newUserName}@twelve.cash</h2>
                <p className="text-center">User name created. Share it with the world to get paid!<sup className="cursor-pointer" onClick={deepAlpha}>*</sup></p>
                <Button text="Make Another One" onClick={startOver} />
                <p className="text-center text-sm cursor-pointer underline" onClick={()=>setShowInfo(!showInfo)}>How do I know this worked?</p>
                {showInfo ?
                  <div className="bg-gray-100 p-2 rounded flex flex-col gap-2 overflow-auto">
                      <p>You can verify that this worked by opening a shell and running:</p>

                      <code>dig txt {newUserName}.user._bitcoin-payment.twelve.cash</code>

                      <p>The expected output should be:</p>

                      <code>
                        {newUserName}.user._bitcoin-payment.twelve.cash. 3600 IN TXT &quot;bitcoin:?lno={newOffer}&quot;
                      </code>
                  </div>
                : ``}
              </>
            : showSuccess === false ?
                <>
                  <h2 className="text-2xl font-semibold w-full hyphens-auto text-center">Sorry! 😢</h2>
                  <p className="text-center">Something messed up and it didn&apos;t work.</p>
                  <p className="text-center font-bold">{failureMessage}</p>
                  <Button text="Try Again" onClick={startOver} />
                </>
            :
                <>
                  <p className="text-center">Processing...</p>
                </>
            }
          </div>
        : ``}

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
