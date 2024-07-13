import { bech32 } from "bech32";

export const lnaddrToLNURL = (lnaddr: string) => {
  const [username, domain] = lnaddr.split("@");
  // TODO: Fix checks
  if (!username || !domain)
    throw new Error("Failed to parse lightning address");
  const decodedLnurl = `https://${domain}/.well-known/lnurlp/${username}`;
  console.debug("decodedLnurl", decodedLnurl);

  let words = bech32.toWords(Buffer.from(decodedLnurl, "utf8"));
  const lnurl = bech32.encode("lnurl", words);
  console.debug("lnurl", lnurl);
  return lnurl;
};
