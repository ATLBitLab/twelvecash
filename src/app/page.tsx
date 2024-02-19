"use client";
import Input from "./components/Input";
import Button from "./components/Button";

export default function Home() {
  const createRecord = async () => {
    const res = await fetch("/record", {
      method: "POST",
    });
    const json = await res.json();
    console.debug("json", json);
  };
  return (
    <div className="text-purple-800 bg-12teal h-full min-h-screen flex flex-col justify-between">
      <main className="flex flex-col gap-8">
        {/* Title */}
        <div className="flex flex-col gap-2">
          <h1 className="text-5xl">TwelveCash</h1>
          <p className="text-3xl">A simple way to receive bitcoin<sup>*</sup></p>
        </div>

        <p>Choose your own user name, give us your bitcoin payment instructions, and share your user name with the world!</p>
        
        <div className="flex flex-col gap-2">
          <h2 className="font-bold">1. Choose a User Name</h2>

          <Input placeholder="satoshi" append="@twelve.cash" />

          <Button text="Continue" format="primary" />
        </div>
      </main>
      <footer className="border-t border-t-purple-800 pt-2 mt-4">
        <ul className="flex flex-col gap-2">
          <li><a href="#">Developer Docs</a></li>
          <li>Made with  🧡 at <a href="https://atlbitlab.com/">ATL BitLab</a></li>
        </ul>
      </footer>
    </div>
  );
}
