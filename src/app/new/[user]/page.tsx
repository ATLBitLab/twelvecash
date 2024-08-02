"use client";
import Bip353Box from "@/app/components/Bip353Box"
import React from 'react'
import useWindowSize from "react-use/lib/useWindowSize"
import Confetti from 'react-confetti'
import { useState, useEffect } from "react";
import CopyUserLinkButton from "@/app/features/CopyUserLinkButton";
import CopyBip353Button from "@/app/features/CopyBip353Button";

export default function NewUser({ params }: { params: { user: string } }){
    const decoded = decodeURIComponent(params.user);
    const [user, domain] = decoded.split("@");
    // const { width, height } = useWindowSize()
    // console.log(width, height)

    const [windowSize, setWindowSize] = useState({
        width: 0,
        height: 0,
      });
    
    useEffect(() => {
    // Handler to call on window resize
        const handleResize = () => {
            setWindowSize({
            width: document.documentElement.clientWidth,
            height: window.innerHeight,
            });
        };

        // Add event listener
        window.addEventListener('resize', handleResize);

        // Call handler right away so state gets updated with initial window size
        handleResize();

        // Remove event listener on cleanup
        return () => window.removeEventListener('resize', handleResize);
    }, []); // Empty array ensures that effect is only run on mount and unmount

    return(
        <>
            <main className="mx-auto max-w-4xl flex flex-col gap-9 w-full text-center p-2 md:p-6">
            <Confetti
                width={windowSize.width-20}
                height={windowSize.height}
                numberOfPieces={300}
                recycle={false}
            />
                <h1>Pay code created!</h1>
                <p className="text-xl">Your pay code is created, but it may take 5-10 minutes for the pay code to work. Enjoy!</p>
                <Bip353Box users={[{user, domain}]} />
                <div className={`flex flex-col md:flex-row gap-4`}>
                    <div className="flex md:w-1/2">
                        <CopyUserLinkButton link={'https://twelve.cash/' + user + '@' + domain} />
                    </div>
                    <div className="flex md:w-1/2">
                        <CopyBip353Button user={user} domain={domain} />
                    </div>
                </div>
            </main>
        </>
    )
}