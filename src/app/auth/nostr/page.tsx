"use client";
import Button from "@/app/components/Button";
import { api } from "@/trpc/react";
import { useRouter } from "next/navigation";

declare global {
  interface Window {
    nostr: any;
  }
}

export default function NostrAuth() {
  const router = useRouter();
  const { data } = api.auth.getChallenge.useQuery(undefined, {
    refetchOnWindowFocus: false,
    refetchInterval: 5 * 60 * 1000, // 5 min... display timeout?
  });
  const login = api.auth.nostrLogin.useMutation({
    onSuccess: () => {
      router.push(`/account`);
    },
    onError: () => {
      console.error("Failed to log in");
    },
  });
  console.debug("data", data);

  const authenticate = async () => {
    if (!data?.challenge) throw new Error("Missing challenge!");
    let pubkey = "";
    try {
      pubkey = await window.nostr.getPublicKey();
      console.debug("pubkey", pubkey);
    } catch (e: any) {
      console.error("Failed to get public key");
      return;
    }
    const event = {
      kind: 27235,
      pubkey: pubkey,
      created_at: Math.floor(Date.now() / 1000),
      tags: [
        ["u", "https://twelve.cash/api/trpc/auth.login"],
        ["method", "POST"],
        ["payload", data.challenge],
      ],
      content: "",
    };

    let signedEvent = "";
    try {
      signedEvent = await window.nostr.signEvent(event);
    } catch (e: any) {
      console.error("Failed to sign the authentication event");
      return;
    }
    login.mutate({ event: JSON.stringify(signedEvent) });
  };

  // TODO: don't allow re authentication if already logged in, unless adding additional key
  return (
    <main>
      {window?.nostr && data ? (
        <Button onClick={authenticate}>you got nostr!</Button>
      ) : (
        <div>Install a Nip07 extension to authenticate with Nostr!</div>
      )}
      <p>{data ? data.challenge : "yeet"}</p>
    </main>
  );
}
