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
    <div>
      <Button href="/auth/nostr">Authenticate with Nostr</Button>
      <Button>Authenticate with Lightning</Button>
    </div>
  );
}
