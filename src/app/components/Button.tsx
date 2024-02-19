"use client";

interface ButtonProps {
    text?: string;
    format?: "primary" | "secondary";
    disabled?: boolean;
    onClick?: () => void;
}

export default function Button(props:ButtonProps){
    return(
        <>
            <button
                className={`rounded p-4 ${props.format === 'secondary' ? 'bg-yellow-300 text-purple-800' : 'bg-purple-800 text-yellow-300'} ${props.disabled ? 'opacity-75 cursor-not-allowed' : ''}`}
                disabled={props.disabled}
                onClick={props.onClick}
            >
                {props.text || "Click Here"}
            </button>
        </>
    )
}