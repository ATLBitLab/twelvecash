import { api } from "@/trpc/server";
import LogoutButton from "@/app/components/LogoutButton";
import Bip353Box from "../components/Bip353Box";

export default async function Account() {
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
