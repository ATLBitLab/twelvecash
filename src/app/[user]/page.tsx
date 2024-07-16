
import Bip353Box from '../components/Bip353Box';
import CopyUserLinkButton from '../features/CopyUserLinkButton';
import CopyBip353Button from '../features/CopyBip353Button';

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
      </main>
  );
}
