import Button from "../components/Button";
import getUserServer from "../components/getUserServer";

export default async function Auth() {
  const user = await getUserServer();
  if (user) {
    return (
      <div>
        <p>You shouldn&apos;t be here</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-4 max-w-xl mx-auto p-6">
      <p className="text-lg">Sign in to keep track of your pay codes.</p>
      
      <div className="flex flex-col gap-3">
        <Button href="/auth/email">Sign in with Email</Button>
        <Button href="/auth/nostr" format="outline">Sign in with Nostr</Button>
        <Button href="#" format="outline" disabled>Sign in with Lightning</Button>
      </div>
      
      <p className="text-sm text-gray-500 text-center mt-4">
        New here? <a href="/auth/signup" className="text-blue-500 hover:underline">Create an account</a>
      </p>
    </div>
  );
}
