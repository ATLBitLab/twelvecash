import { api } from "@/trpc/server";
import LogoutButton from "@/app/components/LogoutButton";

export default async function Account() {
  const me = await api.user.getMe(); // TODO: fetch all paycodes in db query
  const paycodes = await api.payCode.getUserPaycodes();
  console.debug("me", me);

  return (
    <div>
      <p>hi user!</p>
      <p>{JSON.stringify(me)}</p>
      <LogoutButton />
      <p>Your paycodes</p>
      <div>{JSON.stringify(paycodes)}</div>
    </div>
  );
}
