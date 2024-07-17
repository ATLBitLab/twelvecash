"use client";
import Button from "../components/Button";
import { CopyIcon } from '@bitcoin-design/bitcoin-icons-react/filled';
import type { Bip353 } from "@/lib/util";

export default function CopyBip353Button(props:Bip353){
    return(
        <>
            <Button size="large" wide onClick={()=>{navigator.clipboard.writeText(props.user + "@" + props.domain)}}>
                Copy <CopyIcon className="w-6 h-6" />
            </Button>
        </>
    )
}