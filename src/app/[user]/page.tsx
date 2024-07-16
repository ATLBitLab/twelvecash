
import Bip353Box from '../components/Bip353Box';
import CopyUserLinkButton from '../features/CopyUserLinkButton';
import CopyBip353Button from '../features/CopyBip353Button';
import PaymentDetail from '../components/PaymentDetail';

export default function User({params}: {params: {user: string}}) {
  const decoded = decodeURIComponent(params.user);
  const [user, domain] = decoded.split('@');
  return (
    <main className="mx-auto max-w-4xl flex flex-col gap-9 w-full text-center p-6 min-h-full">
        <h1>Check Paycode</h1>
        <Bip353Box user={user} domain={domain} />
        Validated! (Or not)
        <div className="flex flex-row gap-4">
          <CopyUserLinkButton link={'https://twelve.cash/' + user + '@' + domain} />
          <CopyBip353Button bip353={user + '@' + domain} />
        </div>
        <div className="flex flex-col gap-4">
          <h2 className="h3 text-left">Payment Details</h2>
          <dl className="flex flex-col gap-4">
            <PaymentDetail label="All Data" value="bitcoin:bc1pdfgdfgdfgdfgdfgdfgdfgdfgdfgdfgdfgdfgdfgdfgdfgdfgdfgdfgdfgdfgdfg" uri="bitcoin:bc1p123xyz" />
            <PaymentDetail label="BOLT 12 Offer Data" value="lno1234567890" uri="bitcoin:bc1p123xyz" />
          </dl>
        </div>
      </main>
  );
}
