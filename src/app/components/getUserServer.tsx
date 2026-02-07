import { parse } from "cookie";
import { headers } from "next/headers";
import jwt from "jsonwebtoken";
import { TokenUser } from "@/server/api/trpc";

// Get the user on server components
export default async function getUser() {
  const cookieHeader = (await headers()).get("cookie") || "";
  const cookies = cookieHeader ? parse(cookieHeader) : {};
  const accessToken = cookies["access-token"];
  const user = accessToken
    ? (jwt.verify(accessToken, process.env.JWT_SECRET ?? "") as TokenUser)
    : undefined;
  return user;
}
