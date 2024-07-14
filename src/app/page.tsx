"use client";
import Image from "next/image";
import CreateForm from "./features/CreateForm";
import CheckForm from "./features/CheckForm";

export default function Home() {
  const deepAlpha = () => {
    alert("this is deep alpha, y'all");
  }

  return (
      <main className="flex flex-col gap-8 max-w-xl lg:w-1/2 lg:pt-24 lg:pl-6">
        <Image
          src="/twelve.png"
          alt=""
          width={1080}
          height={1080}
          sizes="(min-width: 1024px) 800px, (min-width: 1280px) 1080px, 256px"
          className="w-64 h-64 lg:fixed lg:right-[-15%] lg:top-0 lg:w-[800px] lg:h-[800px] xl:w-[1080px] xl:h-[1080px] pointer-events-none"
        />

        {/* Title */}
        <div className="flex flex-col gap-2 relative z-50">
          <h1 className="text-5xl">TwelveCash</h1>
          <p className="text-3xl">A simple way to receive bitcoin<sup className="cursor-pointer" onClick={deepAlpha}>*</sup></p>
        </div>

        <p className="relative z-50">Choose your own user name, give us your bitcoin payment instructions, and share your user name with the world!</p>

        <div className="bg-white p-6 drop-shadow-xl rounded-lg">
          <CreateForm />
          <CheckForm />
        </div>
      </main>
  );
}
