"use client";

import { useRouter } from "next/navigation";
import { useUser } from "./ClientUserProvider";
import Button from "./Button";
import { api } from "@/trpc/react";
import { signOut } from "@/lib/auth-client";

export default function LogoutButton() {
  const router = useRouter();
  const { setUser } = useUser();
  const logout = api.user.logout.useMutation();

  const handleLogout = async () => {
    await signOut().catch(() => undefined);
    await logout.mutateAsync().catch(() => undefined);
    setUser(undefined);
    router.push(`/`);
    router.refresh();
  };

  return <Button format="secondary" onClick={handleLogout}>Logout</Button>;
}
