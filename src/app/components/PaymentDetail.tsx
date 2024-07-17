"use client";
import { CopyIcon } from "@bitcoin-design/bitcoin-icons-react/filled"
import Button from "./Button";

type PaymentDetailProps = {
    label: string;
    value: string;
    uri: string;
    loading?: boolean;
}

export default function PaymentDetail(props:PaymentDetailProps){

    return(
        <>
            <div className="w-full bg-sky-700 text-white rounded-xl p-6 flex flex-row items-center gap-6 text-4xl font-light drop-shadow-md relative overflow-hidden">
                {props.loading ?
                <>
                    <dt className="bg-orange-200/10 rounded-lg flex-none text-left">
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    </dt>
                    <dd className="grow text-left whitespace-nowrap text-ellipsis overflow-hidden max-w-[320px] bg-white/10 rounded-lg">
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    </dd>
                </>
                :
                <>
                    <dt className="text-orange-200 flex-none text-left">
                        {props.label}
                    </dt>
                    <dd className="grow text-left whitespace-nowrap text-ellipsis overflow-hidden max-w-[320px]">
                        <a href={props.uri}>{props.value}</a>
                    </dd>
                </>
                }
                <span className="flex flex-row justify-end grow">
                    <Button format="free" disabled={props.loading} onClick={()=>{navigator.clipboard.writeText(props.uri)}}><CopyIcon className="w-6 h-6" /></Button>
                </span>
                {props.loading ?
                <div className="absolute top-0 left-0 opacity-50 animate-loading-pulse w-full h-full scale-[0.25] bg-gradient-to-r from-white/0 via-white/25 to-white/0"></div>
                :``}
            </div>
        </>
    )
}