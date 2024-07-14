"use client";
import Input from "../components/Input";
import Button from "../components/Button";
import { useState } from "react";
import * as doh from '../../lib/dnssec-prover/doh_lookup.js';
import { CheckIcon, CrossIcon } from "@bitcoin-design/bitcoin-icons-react/filled";

export default function CheckForm(){
    const [userNameToCheck, setUserNameToCheck] = useState("₿stephen@twelve.cash");
    const [userNameCheck, setUserNameCheck] = useState<any>({});

    const updateUserNameToCheck = (value:string) => {
        setUserNameToCheck(value);
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

    return(
        <>
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
        </>
    )
}