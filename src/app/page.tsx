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
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <button className="rounded px-2 py-1 bg-gray-100" onClick={createRecord}>
        Create Record
      </button>
    </main>
  );
}
