import { api } from "@/trpc/server";
import LogoutButton from "@/app/components/LogoutButton";
import Bip353Box from "../components/Bip353Box";
import { TRPCError } from "@trpc/server";
import getUser from "../components/getUserServer";
import Button from "../components/Button";
import Link from "next/link";

export default async function Account() {
  const user = getUser();
  if (!user) {
    return (
      <main className="max-w-2xl mx-auto text-center flex flex-col gap-4 justify-center items-center p-2 md:p-6">
        <div className="w-full flex flex-row justify-between items-center">
          <h1>You are Logged Out</h1>
          <Button href="/auth">Login</Button>
        </div>
      </main>
    )
  }
  const paycodes = await api.payCode.getUserPaycodes();
  return (
    <main className="max-w-2xl mx-auto text-center flex flex-col gap-4 justify-center items-center p-2 md:p-6">
      <div className="w-full flex flex-row justify-between items-center">
        <h1>Your Acount</h1>
        <LogoutButton />
      </div>
      <hr />
      <div className="w-full text-left flex flex-col gap-4">
        <h2>Your paycodes</h2>
        <div>
          {paycodes.length === 0 &&
            <div className="flex flex-col gap-4 text-lg text-center border border-purple-800 rounded-xl p-6">
              <p>You don't have any paycodes yet</p>
              <div className="inline-block">
                <Button href="/new">Create a new paycode</Button>
              </div>
            </div>
          }
          <div className="flex flex-col gap-4">
            {paycodes.map((pc) => (
              <Link key={pc.id} href={`/${pc.userName}@${pc.domain}`} className="no-underline">
                <Bip353Box users={[{ user: pc.userName, domain: pc.domain }]} />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
