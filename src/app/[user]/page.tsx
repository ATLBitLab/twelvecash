import Bip353Box from "../components/Bip353Box";
import CopyUserLinkButton from "../features/CopyUserLinkButton";
import CopyBip353Button from "../features/CopyBip353Button";
import PaymentDetail from "../components/PaymentDetail";
import Button from "../components/Button";
import { ArrowLeftIcon } from "@bitcoin-design/bitcoin-icons-react/filled";
import UserDetails from "../features/UserDetails";

export default function User({ params }: { params: { user: string } }) {
  const decoded = decodeURIComponent(params.user);
  const [user, domain] = decoded.split("@");
  return (
    <main className="mx-auto max-w-4xl flex flex-col gap-9 w-full text-center p-6">
      <UserDetails user={user} domain={domain} />
      <hr className="border-purple-800/50" />
      <Button href="/search" format="outline" size="large">
        <ArrowLeftIcon className="w-6 h-6" />
        Search Again
      </Button>
    </main>
  );
}
