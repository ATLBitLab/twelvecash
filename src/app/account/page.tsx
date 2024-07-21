import { api } from "@/trpc/server";
import LogoutButton from "@/app/components/LogoutButton";

export default async function Account() {
  const me = await api.user.getMe(); // TODO: fetch all paycodes in db query
  console.debug("me", me);

  return (
    <div>
      <p>hi user!</p>
      <p>{JSON.stringify(me)}</p>
      <LogoutButton />
    </div>
  );
}
