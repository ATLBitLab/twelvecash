import { api } from "@/trpc/server";
import Button from "../components/Button";

export default function Auth() {
  // const challenge = await api.auth.getChallenge();
  return (
    <div>
      <Button href="/auth/nostr">Authenticate with Nostr</Button>
      <Button>Authenticate with Lightning</Button>
    </div>
  );
}
