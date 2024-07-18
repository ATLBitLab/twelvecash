"use client";
import Button from "../components/Button";
import { CopyIcon } from '@bitcoin-design/bitcoin-icons-react/filled';
import type { Bip353 } from "@/lib/util";
import { useState } from "react";

export default function CopyBip353Button(props:Bip353){
    const [copied, setCopied] = useState(false);
    return(
        <>
            <Button size="large" wide onClick={()=>{navigator.clipboard.writeText(props.user + "@" + props.domain); setCopied(!copied)}}>
                {copied ? "Copied!" : "Copy"} <CopyIcon className="w-6 h-6" />
            </Button>
        </>
    )
}