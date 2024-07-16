"use client";
import Input from "../components/Input";
import  Button from "../components/Button";
import { useState } from "react";

type CreateFormProps = {
    defaultDomain: string;
}

export default function CreateForm(props:CreateFormProps){
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

    const [currentStep, setCurrentStep] = useState(0);
    const [newUserName, setUserName] = useState("");
    const [newOffer, setOffer] = useState("");
    const [showInfo, setShowInfo] = useState(false);
    const [showSuccess, setShowSuccess] = useState<boolean|null>(null);
    const [failureMessage, setFailureMessage] = useState(defaultFailureMessage);

    const updateUserName = (value:string) => {
        setUserName(value);
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

    return(
        <>
            {currentStep === 0 ?
                <div className="flex flex-col gap-4 relative z-50">
                    <h2 className="font-bold">1. Choose a User Name</h2>

                    <Input placeholder="satoshi" prepend="₿" append={"@" + props.defaultDomain} value={newUserName} onChange={updateUserName} />

                    <Button text="Continue" format="primary" disabled={newUserName === ""} onClick={()=>setCurrentStep(1)}  />
                </div>
                : currentStep === 1 ?
                <div className="flex flex-col gap-4">
                    <h2 className="font-bold">2. Bitcoin Payment Instructions</h2>

                    <p>This should be a BOLT 12 offer from a compatible wallet or lightning node.</p>

                    <Input placeholder="lno1..." value={newOffer} onChange={updateOffer} />

                    <div className="flex flex-row gap-2 items-center justify-end">
                    <Button text="Back" format="secondary" onClick={()=>setCurrentStep(0)}  />
                    <Button text="Finish" format="primary" onClick={()=>{createRecord(); setCurrentStep(2);}}  />
                    </div>
                </div>
                : currentStep === 2 ?
                <div className="flex flex-col gap-4 bg-white rounded p-4">
                    {showSuccess === true ?
                    <>
                        <h2 className="text-2xl font-semibold w-full hyphens-auto text-center">{newUserName}@{props.defaultDomain}</h2>
                        <p className="text-center">User name created. Share it with the world to get paid!<sup className="cursor-pointer" onClick={deepAlpha}>*</sup></p>
                        <Button text="Make Another One" onClick={startOver} />
                        <p className="text-center text-sm cursor-pointer underline" onClick={()=>setShowInfo(!showInfo)}>How do I know this worked?</p>
                        {showInfo ?
                        <div className="bg-gray-100 p-2 rounded flex flex-col gap-2 overflow-auto">
                            <p>You can verify that this worked by opening a shell and running:</p>

                            <code>dig txt {newUserName}.user._bitcoin-payment.{props.defaultDomain}</code>

                            <p>The expected output should be:</p>

                            <code>
                                {newUserName}.user._bitcoin-payment.{props.defaultDomain}. 3600 IN TXT &quot;bitcoin:?lno={newOffer}&quot;
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
        </>
    );
}