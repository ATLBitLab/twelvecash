"use client";
import { useState } from "react";

interface InputProps {
    placeholder?: string;
    value?: string;
    append?: string;
    prepend?: string;
    focus?: boolean;
}

export default function Input(props:InputProps) {
    const [focus, setFocus] = useState(false);

    return (
        <>
            <div className={`p-4 rounded bg-white flex flex-row justify-between gap-2 ${focus ? 'outline-purple-800 outline-2 outline' : ''}`}>
                <div className={`text-black ${!props.prepend ? 'hidden' : ''}`}>
                    {props.prepend}
                </div>
                <input
                    type="text"
                    placeholder={props.placeholder}
                    className="w-full focus:border-0 focus:outline-none"
                    value={props.value}
                    onFocus={ ()=>{ setFocus(true); } }
                    onBlur={ ()=>{ setFocus(false); } }
                />
                <div className={`text-black ${!props.append ? 'hidden' : ''}`}>
                    {props.append}
                </div>
            </div>
        </>
    );
}