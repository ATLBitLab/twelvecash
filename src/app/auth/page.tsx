import Button from "../components/Button";
import getUserServer from "../components/getUserServer";

export default function Auth() {
  const user = getUserServer();
  if (user) {
    return (
      <div>
        <p>You shouldn't be here</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-4 max-w-xl mx-auto p-6">
      <p className="text-lg">Login with your Nostr key so that you can keep track of your user names.</p>
      <Button href="/auth/nostr">Authenticate with Nostr</Button>
      <Button href="#" format="outline" disabled>Authenticate with Lightning</Button>
    </div>
  );
}
