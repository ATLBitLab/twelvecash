import jwt from "jsonwebtoken";
import { TokenUser } from "@/server/api/trpc";
import { headers } from "next/headers";
import { parse } from "cookie";
import ClientUserProvider from "./ClientUserProvider";

export default async function UserProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieHeader = (await headers()).get("cookie") || "";
  const cookies = cookieHeader ? parse(cookieHeader) : {};
  const accessToken = cookies["access-token"];
  const user = accessToken
    ? (jwt.verify(accessToken, process.env.JWT_SECRET ?? "") as TokenUser)
    : undefined;

  return <ClientUserProvider initialUser={user}>{children}</ClientUserProvider>;
}
