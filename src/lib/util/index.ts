import { bech32 } from "bech32";

export const lnaddrToLNURL = (lnaddr: string) => {
  const [username, domain] = lnaddr.split("@");
  if (!username || !domain)
    throw new Error("Failed to parse lightning address");

  const decodedLnurl = `https://${domain}/.well-known/lnurlp/${username}`;
  console.debug("decodedLnurl", decodedLnurl);

  let words = bech32.toWords(Buffer.from(decodedLnurl, "utf8"));
  const lnurl = bech32.encode("lnurl", words);
  console.debug("lnurl", lnurl);
  return lnurl;
};

type Custom = {
  prefix: string;
  value: string;
};

export type Bip21Dict = {
  onChain?: string;
  label?: string;
  lno?: string;
  sp?: string;
  custom?: Custom[];
};

export const createBip21 = (payload: Bip21Dict): string => {
  const base = payload.onChain ? `bitcoin:${payload.onChain}` : "bitcoin:";
  const url = new URL(base);

  if (payload.label && payload.onChain)
    url.searchParams.append("label", payload.label);
  if (payload.lno) url.searchParams.append("lno", payload.lno);
  if (payload.sp) url.searchParams.append("sp", payload.sp);

  if (Array.isArray(payload.custom)) {
    payload.custom.forEach((item: Custom) => {
      url.searchParams.append(item.prefix, item.value);
    });
  }

  const bip21 = url.toString();
  if (bip21 === "bitcoin:") throw new Error("No payment option provided");
  if (bip21.length > 2048)
    throw new Error("Bip21 URI is greater than 2048 characters");

  return bip21;
};
