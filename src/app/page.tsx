"use client";

export default function Home() {
  const createRecord = async () => {
    const res = await fetch("/record", {
      method: "POST",
    });
    const json = await res.json();
    console.debug("json", json);
  };
  return (
    <div className="text-purple-800 bg-12teal h-full min-h-screen">
      <main className="flex flex-col gap-2">
        {/* Title */}
        <div className="flex flex-col gap-2">
          <h1 className="text-5xl">TwelveCash</h1>
          <p className="text-3xl">A simple way to receive bitcoin<sup>*</sup></p>
        </div>
        
        <p>Choose your own user name, give us your bitcoin payment instructions, and share your user name with the world!</p>

        {/* <button className="rounded px-2 py-1 bg-gray-100" onClick={createRecord}>
          Create Record
        </button> */}
      </main>
      <footer className="border-t border-t-purple-800 pt-2 mt-2">
        <ul className="flex flex-col gap-2">
          <li><a href="#">Developer Docs</a></li>
          <li>Made with  🧡 at <a href="https://atlbitlab.com/">ATL BitLab</a></li>
        </ul>
      </footer>
    </div>
  );
}
