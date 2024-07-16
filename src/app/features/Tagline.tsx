"use client";

export default function Tagline(){
    const deepAlpha = () => {
        alert("this is deep alpha, y'all");
    }

    return(
        <>
            <p className="text-3xl">A simple way to receive bitcoin<sup className="cursor-pointer" onClick={deepAlpha}>*</sup></p>
        </>
    )
}