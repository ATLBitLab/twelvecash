"use client";
import Button from "../components/Button";
import { LinkIcon } from '@bitcoin-design/bitcoin-icons-react/filled';

type CopyUserLinkButtonProps = {
  link: string;
}

export default function CopyUserLinkButton(props:CopyUserLinkButtonProps){
    return(
        <>
          <Button format="secondary" wide onClick={()=>{alert('TODO: Copy to Clipboard - ' + props.link)}}>
            Share Link <LinkIcon className="w-6 h-6" />
          </Button>
        </>
    )
}