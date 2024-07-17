"use client";
import { useState, useEffect } from "react";
import * as doh from '../../lib/dnssec-prover/doh_lookup.js';
import Bip353Box from "../components/Bip353Box";
import type { Bip353 } from "@/lib/util/index.js";
import CopyUserLinkButton from "./CopyUserLinkButton";
import CopyBip353Button from "./CopyBip353Button";
import Button from "../components/Button";

export default function UserDetails(props:Bip353){
    const [userNameCheck, setUserNameCheck] = useState<any>({});
    const [validPayCode, setValidPayCode] = useState<boolean | null>(null);
    const [multipleRecords, setMultipleRecords] = useState<boolean>(false);

    const checkUserName = ()=>{
        doh.lookup_doh(`${props.user}.user._bitcoin-payment.${props.domain}`, 'TXT', 'https://dns.google/dns-query').then((response)=>{  
            console.log(response);
            let validation = JSON.parse(response)
            setUserNameCheck(validation);

            if(validation.valid_from && validation.verified_rrs.length === 1) setValidPayCode(true);
            else if(validation.valid_from && validation.verified_rrs.length > 1) {
                setValidPayCode(false);
                setMultipleRecords(true);
            }
            else setValidPayCode(false);
        });
    }

    useEffect(() => {
        const timer = setTimeout(() => {
            checkUserName();
        }, 0);
        return () => clearTimeout(timer); // Cleanup in case the component unmounts
    }, []);

    return(
        <>  
            <h1 className="text-left">{validPayCode ? "Valid" : "Invalid"} Paycode</h1>
            <Bip353Box user={props.user} domain={props.domain} />
            <div className="flex flex-row gap-4">
            <CopyUserLinkButton link={'https://twelve.cash/' + props.user + '@' + props.domain} />
            <CopyBip353Button user={props.user} domain={props.domain} />
        </div>
        </>
    )
}