"use client";
import { useUser } from "@/app/components/ClientUserProvider";
import { api } from "@/trpc/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import NostrAuthSpinner from "@/app/features/NostrAuthSpinner";

declare global {
  interface Window {
    nostr: any;
  }
}

export default function NostrAuth() {
  const router = useRouter();
  const user = useUser();
  const [nostrReady, setNostrReady] = useState(false);
  const { data } = api.auth.getChallenge.useQuery(undefined, {
    refetchOnWindowFocus: false,
    refetchInterval: 5 * 60 * 1000, // 5 min... display timeout?
  });
  const login = api.auth.nostrLogin.useMutation({
    onSuccess: (data) => {
      user.setUser(data.user);
      router.push(`/account`);
    },
    onError: () => {
      console.error("Failed to log in");
      // handle timeout
    },
  });

  useEffect(() => {
    if (!window.nostr) return;
    setNostrReady(true);
    if (data?.challenge) authenticate();
  }, [data?.challenge]);

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

  if (user.user) {
    router.push('/account');
    return (
      <main className="max-w-lg mx-auto text-center flex flex-col gap-4 justify-center items-center p-6">
        <NostrAuthSpinner
          text="Going to your account"
          button={false}
        />
      </main>
    );
  }

  return(
    <main className="max-w-lg mx-auto text-center flex flex-col gap-4 justify-center items-center p-6">
      <NostrAuthSpinner
        text={nostrReady && data ? "Trying to log in with Nostr" : "Checking for Nostr..."}
        buttonText="Login with Browser Extension"
        buttonFunction={authenticate}
        buttonDisabled={nostrReady && data ? false : true}
        button={nostrReady && data ? false : true}
      />
    </main>
  )
}
