"use client";
import Button from "../components/Button";
import { LinkIcon } from '@bitcoin-design/bitcoin-icons-react/filled';
import { useState } from "react";

type CopyUserLinkButtonProps = {
  link: string;
}

export default function CopyUserLinkButton(props:CopyUserLinkButtonProps){
    const [copied, setCopied] = useState(false);
    return(
        <>
          <Button size="large" format="secondary" wide onClick={()=>{navigator.clipboard.writeText(props.link); setCopied(!copied)}}>
          {copied ? "Copied!" : "Share Link"} <LinkIcon className="w-6 h-6" />
          </Button>
        </>
    )
}