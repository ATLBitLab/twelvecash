"use client";
import { ChangeEvent, useState } from "react";

interface InputProps {
    placeholder?: string;
    value?: string;
    append?: string;
    prepend?: string;
    focus?: boolean;
    onChange?: (value:string) => void;
    label?: string;
    description?: string;
}

export default function Input(props:InputProps) {
    const [focus, setFocus] = useState(false);

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if(props.onChange) props.onChange(event.target.value);
    }

    return (
        <>
            <div className="flex flex-col gap-2">
                {props.label ?
                <label className="font-semibold text-lg">{props.label}</label>
                : ``}
                <div className={`p-6 rounded-xl bg-white/50 flex flex-row justify-between gap-2 border-gray-200 border shadow-inner text-xl ${focus ? 'outline-purple-800 outline-2 outline' : ''}`}>
                    <div className={`text-purple-600 ${!props.prepend ? 'hidden' : ''}`}>
                        {props.prepend}
                    </div>
                    <input
                        type="text"
                        placeholder={props.placeholder}
                        className="w-full focus:border-0 focus:outline-none bg-white/0"
                        value={props.value}
                        onFocus={ ()=>{ setFocus(true); } }
                        onBlur={ ()=>{ setFocus(false); } }
                        onChange={handleInputChange}
                    />
                    <div className={`text-black ${!props.append ? 'hidden' : ''}`}>
                        {props.append}
                    </div>
                </div>
                {props.description ?
                <p>{props.description}</p>
                : ``}
            </div>
        </>
    );
}