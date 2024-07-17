
import Bip353Box from '../components/Bip353Box';
import CopyUserLinkButton from '../features/CopyUserLinkButton';
import CopyBip353Button from '../features/CopyBip353Button';
import PaymentDetail from '../components/PaymentDetail';
import Button from '../components/Button';
import { ArrowLeftIcon } from '@bitcoin-design/bitcoin-icons-react/filled';
import UserDetails from '../features/UserDetails';

export default function User({params}: {params: {user: string}}) {
  const decoded = decodeURIComponent(params.user);
  const [user, domain] = decoded.split('@');
  return (
    <main className="mx-auto max-w-4xl flex flex-col gap-9 w-full text-center p-6 min-h-full">
        <UserDetails user={user} domain={domain} />
        <div className="flex flex-col gap-4 pt-8">
          <h2 className="h3 text-left">Payment Details</h2>
          <dl className="flex flex-col gap-4">
            <PaymentDetail label="All Data" value="bitcoin:bc1pdfgdfgdfgdfgdfgdfgdfgdfgdfgdfgdfgdfgdfgdfgdfgdfgdfgdfgdfgdfgdfg" uri="bitcoin:bc1p123xyz" />
            <PaymentDetail label="Offer" value="lno1234567890" uri="bitcoin:bc1p123xyz" />
          </dl>
        </div>
        <hr className="border-purple-800/50" />
          <Button href="/search" format="outline" size="large"><ArrowLeftIcon className="w-6 h-6" />Search Again</Button>
      </main>
  );
}
