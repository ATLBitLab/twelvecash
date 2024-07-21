"use client";

import { useRouter } from "next/navigation";
import { useUser } from "./ClientUserProvider"; // Adjust the import path as necessary
import Button from "./Button";
import { api } from "@/trpc/react";

export default function LogoutButton() {
  const router = useRouter();
  const { setUser } = useUser();
  const logout = api.user.logout.useMutation({
    onSuccess: () => {
      console.debug("logged out");
      setUser(undefined);
      router.push(`/`);
    },
    onError: () => {
      console.error("Failed to log in");
    },
  });

  return <Button onClick={() => logout.mutate()}>Logout</Button>;
}
