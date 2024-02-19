"use client";
import Input from "./components/Input";
import Button from "./components/Button";
import { useState } from "react";

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

  const addContact = async () => {
    const res = await fetch("https://hooks.zapier.com/hooks/catch/6163041/3e539p0/", {
      method: "POST",
      body: JSON.stringify({ userName: newUserName, contact: newContact })
    });
    const json = await res.json();
    console.debug("json", json);
  };

  const defaultFailureMessage = "Tbh, we're not sure.";

  const [newUserName, setUserName] = useState("");
  const [newOffer, setOffer] = useState("");
  const [newContact, setContact] = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  const [showInfo, setShowInfo] = useState(false);
  const [showSuccess, setShowSuccess] = useState<boolean|null>(false);
  const [failureMessage, setFailureMessage] = useState(defaultFailureMessage);

  const updateUserName = (value:string) => {
    setUserName(value);
  }

  const updateOffer = (value:string) => {
    setOffer(value);
  }

  const updateContact = (value:string) => {
    setContact(value);
  }

  const deepAlpha = () => {
    alert("this is deep alpha, y'all");
  }

  const startOver = () => {
    setCurrentStep(0);
    setUserName("");
    setOffer("");
    setContact("");
    setShowInfo(false);
    setShowSuccess(null);
  }

  return (
    <div className="text-purple-800 bg-12teal h-full min-h-screen flex flex-col justify-between">
      <main className="flex flex-col gap-8">
        {/* Title */}
        <div className="flex flex-col gap-2">
          <h1 className="text-5xl">TwelveCash</h1>
          <p className="text-3xl">A simple way to receive bitcoin<sup className="cursor-pointer" onClick={deepAlpha}>*</sup></p>
        </div>

        <p>Choose your own user name, give us your bitcoin payment instructions, and share your user name with the world!</p>
        
        {currentStep === 0 ?
          <div className="flex flex-col gap-2">
            <h2 className="font-bold">1. Choose a User Name</h2>

            <Input placeholder="satoshi" append="@twelve.cash" value={newUserName} onChange={updateUserName} />

            <Button text="Continue" format="primary" disabled={newUserName === ""} onClick={()=>setCurrentStep(1)}  />
          </div>
        : currentStep === 1 ?
          <div className="flex flex-col gap-2">
            <h2 className="font-bold">2. Bitcoin Payment Instructions</h2>

            <p>This should be a BOLT 12 offer from a compatible wallet or lightning node.</p>

            <Input placeholder="lno1..." value={newOffer} onChange={updateOffer} />

            <div className="flex flex-row gap-2 items-center justify-end">
              <Button text="Back" format="secondary" onClick={()=>setCurrentStep(0)}  />
              <Button text="Continue" format="primary" disabled={newOffer === ""} onClick={()=>setCurrentStep(2)}  />
            </div>
          </div>
        : currentStep === 2 ?
          <div className="flex flex-col gap-2">
            <h2 className="font-bold">3. Ownership (optional)</h2>

            <p>Do you want to be able to edit this username later? If so, give us an email address, Nostr npub, etc. that you will contact us from to do so. This is optional!</p>

            <Input placeholder="name@email.com" value={newContact} onChange={updateContact} />

            <div className="flex flex-row gap-2 items-center justify-end">
              <Button text="Back" format="secondary" onClick={()=>setCurrentStep(1)}  />
              <Button text={newContact !== "" ? "Finish" : "Skip This and Finish"} format="primary" onClick={()=>{createRecord(); if(newContact !== "") {addContact();} setCurrentStep(3);}}  />
            </div>
          </div>
        : currentStep === 3 ?
          <div className="flex flex-col gap-2 bg-white rounded p-4">
            {showSuccess === true ?
              <>
                <h2 className="text-2xl font-semibold w-full hyphens-auto text-center">{newUserName}@twelve.cash</h2>
                <p className="text-center">User name created. Share it with the world to get paid!<sup className="cursor-pointer" onClick={deepAlpha}>*</sup></p>
                <Button text="Make Another One" onClick={startOver} />
                <p className="text-center text-sm cursor-pointer underline" onClick={()=>setShowInfo(!showInfo)}>How do I know this worked?</p>
                {showInfo ?
                  <div className="bg-gray-100 p-2 rounded flex flex-col gap-2">
                      <p>You can verify that this worked by opening a shell and running:</p>

                      <code>dig txt {newUserName}.user._bitcoin-payment.twelve.cash</code>

                      <p>The expected output should be:</p>

                      <code>
                        {newUserName}.user._bitcoin-payment.twelve.cash. 3600 IN TXT "bitcoin:?b12={newOffer}"
                      </code>
                  </div>
                : ``}
              </>
            : showSuccess === false ?
                <>
                  <h2 className="text-2xl font-semibold w-full hyphens-auto text-center">Sorry! 😢</h2>
                  <p className="text-center">Something messed up and it didn't work.</p>
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
      </main>
      <footer className="border-t border-t-purple-800 pt-2 mt-4">
        <ul className="flex flex-col gap-2">
          <li><a href="#">Developer Docs</a></li>
          <li>Made with  🧡 at <a href="https://atlbitlab.com/">ATL BitLab</a></li>
        </ul>
      </footer>
    </div>
  );
}
