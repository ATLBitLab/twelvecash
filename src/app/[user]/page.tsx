import type { Metadata } from "next";
import Button from "../components/Button";
import { ArrowLeftIcon } from "@bitcoin-design/bitcoin-icons-react/filled";
import UserDetails from "../features/UserDetails";

const DEFAULT_DOMAIN = "twelve.cash";

function parseUserParam(userParam: string) {
  const decoded = decodeURIComponent(userParam);
  const [user, domain = DEFAULT_DOMAIN] = decoded.split("@");
  return { user, domain };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ user: string }>;
}): Promise<Metadata> {
  const { user: userParam } = await params;
  const { user, domain } = parseUserParam(userParam);
  const displayName = `${user}@${domain}`;
  const description = `Send bitcoin to ${displayName} with TwelveCash.`;

  return {
    title: `${displayName} | TwelveCash`,
    description,
    openGraph: {
      title: `${displayName} | TwelveCash`,
      description,
      images: [{ url: `/${encodeURIComponent(displayName)}/opengraph-image` }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${displayName} | TwelveCash`,
      description,
      images: [`/${encodeURIComponent(displayName)}/opengraph-image`],
    },
    alternates: {
      canonical: `/${encodeURIComponent(displayName)}`,
    },
    other: {
      "og:image:alt": `${displayName} on TwelveCash`,
    },
  };
}

export default async function User({ params }: { params: Promise<{ user: string }> }) {
  const { user: userParam } = await params;
  const { user, domain } = parseUserParam(userParam);
  return (
    <main className="mx-auto max-w-4xl flex flex-col gap-9 w-full text-center p-2 md:p-6">
      <UserDetails user={user} domain={domain} />
      <hr className="border-purple-800/50" />
      <Button href="/search" format="outline" size="large">
        <ArrowLeftIcon className="w-6 h-6" />
        Search Again
      </Button>
    </main>
  );
}
