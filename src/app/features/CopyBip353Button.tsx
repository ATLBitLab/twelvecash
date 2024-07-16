"use client";
import Button from "../components/Button";
import { CopyIcon } from '@bitcoin-design/bitcoin-icons-react/filled';

type CopyBip353ButtonProps = {
    bip353: string;
}

export default function CopyBip353Button(props:CopyBip353ButtonProps){
    return(
        <>
            <Button wide onClick={()=>{alert('TODO: Copy to Clipboard - ' + props.bip353)}}>
                Copy <CopyIcon className="w-6 h-6" />
            </Button>
        </>
    )
}