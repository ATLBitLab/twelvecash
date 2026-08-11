import { headers } from "next/headers";
import { getCurrentUser } from "@/lib/current-user";

// Get the user on server components
export default async function getUser() {
  return getCurrentUser(await headers());
}
