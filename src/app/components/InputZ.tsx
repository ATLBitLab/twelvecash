"use client";
import { useState } from "react";

interface InputProps {
  name: string;
  register: Function;
  placeholder?: string;
  append?: string;
  prepend?: string;
  label?: string;
  description?: string;
  hidden?: boolean;
  error?: boolean;
}

export default function Input(props: InputProps) {
  const [focus, setFocus] = useState(false);

  return (
    <>
      <div className={`flex flex-col gap-2 ${props.hidden && "hidden"}`}>
        {props.label ? (
          <label className="font-semibold text-lg">{props.label}</label>
        ) : (
          ``
        )}
        <div
          className={`p-6 rounded-xl bg-white/50 flex flex-row justify-between gap-2 border-gray-200 border shadow-inner text-xl ${
            focus ? "outline-purple-800 outline-2 outline" : ""
          }`}
        >
          <div className={`text-purple-600 ${!props.prepend ? "hidden" : ""}`}>
            {props.prepend}
          </div>
          <input
            type="text"
            placeholder={props.placeholder}
            className="w-full focus:border-0 focus:outline-none bg-white/0"
            spellCheck={false}
            autoComplete="off"
            onFocus={() => {
              setFocus(true);
            }}
            {...props.register(props.name, {
              onBlur: () => setFocus(false),
            })}
          />
          <div className={`text-black ${!props.append ? "hidden" : ""}`}>
            {props.append}
          </div>
        </div>
        {props.description ? <p className={props.error ? "text-red-500 font-medium" : ""}>{props.description}</p> : ``}
      </div>
    </>
  );
}
