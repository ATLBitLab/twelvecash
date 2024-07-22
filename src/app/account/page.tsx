import { api } from "@/trpc/server";
import LogoutButton from "@/app/components/LogoutButton";
import Bip353Box from "../components/Bip353Box";
import { TRPCError } from "@trpc/server";
import getUser from "../components/getUserServer";

export default async function Account() {
  const user = getUser();
  if (!user) {
    return <p>You shouldn't be here</p>;
  }
  const paycodes = await api.payCode.getUserPaycodes();
  return (
    <div>
      <p>hi user!</p>
      <LogoutButton />
      <p>Your paycodes</p>
      <div>
        {paycodes.map((pc) => (
          <Bip353Box users={[{ user: pc.userName, domain: pc.domain }]} />
        ))}
      </div>
    </div>
  );
}
