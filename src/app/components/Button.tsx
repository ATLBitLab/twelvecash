"use client";

interface ButtonProps {
    text?: string;
    format?: "primary" | "secondary";
}

export default function Button(props:ButtonProps){
    return(
        <>
            <button className={`rounded p-4 ${props.format === 'secondary' ? 'bg-yellow-400 text-purple-800' : 'bg-purple-800 text-yellow-400'}`}>
                {props.text || "Click Here"}
            </button>
        </>
    )
}