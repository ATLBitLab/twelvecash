import { headers } from "next/headers";
import { getCurrentUser } from "@/lib/current-user";
import ClientUserProvider from "./ClientUserProvider";

export default async function UserProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser(await headers());

  return <ClientUserProvider initialUser={user}>{children}</ClientUserProvider>;
}
