"use client";
import { CopyIcon } from "@bitcoin-design/bitcoin-icons-react/filled"
import Button from "./Button";

type PaymentDetailProps = {
    label: string;
    value: string;
    uri: string;
}

export default function PaymentDetail(props:PaymentDetailProps){
    return(
        <>
            <div className="w-full bg-sky-700 text-white rounded-xl p-6 flex flex-row items-center gap-6 text-4xl font-light">
                <dt className="text-orange-200 flex-none text-left">{props.label}</dt>
                <dd className="grow text-left whitespace-nowrap text-ellipsis overflow-hidden"><a href={props.uri}>{props.value}</a></dd>
                <Button format="free" onClick={()=>{navigator.clipboard.writeText(props.uri)}}><CopyIcon className="w-6 h-6" /></Button>
            </div>
        </>
    )
}