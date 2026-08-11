import jwt from "jsonwebtoken";
import { parse } from "cookie";
import { auth } from "@/lib/auth";
import { db } from "@/server/db";

export interface AppUser {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  lastLogin: Date | null;
  nostrPublicKey: string | null;
  lnNodePublicKey: string | null;
  apiKey: string;
  name?: string | null;
  email?: string | null;
  emailVerified?: boolean;
  image?: string | null;
}

async function getBetterAuthUser(headers: Headers): Promise<AppUser | undefined> {
  const session = await auth.api.getSession({ headers });
  const sessionUser = session?.user;

  if (!sessionUser?.id) {
    return undefined;
  }

  const user = await db.user.findUnique({
    where: { id: sessionUser.id },
  });

  return user ?? undefined;
}

function getLegacyJwtUser(headers: Headers): AppUser | undefined {
  const cookieHeader = headers.get("cookie") || "";
  const cookies = cookieHeader ? parse(cookieHeader) : {};
  const accessToken = cookies["access-token"];

  if (!accessToken || !process.env.JWT_SECRET) {
    return undefined;
  }

  try {
    return jwt.verify(accessToken, process.env.JWT_SECRET) as AppUser;
  } catch {
    return undefined;
  }
}

export async function getCurrentUser(headers: Headers): Promise<AppUser | undefined> {
  const betterAuthUser = await getBetterAuthUser(headers);
  if (betterAuthUser) {
    return betterAuthUser;
  }

  return getLegacyJwtUser(headers);
}
