import { bech32 } from "bech32";
import { z } from "zod";

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

export type Bip353 = {
  user: string;
  domain: string;
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

export function getZodEnumFromObjectKeys<
  TI extends Record<string, any>,
  R extends string = TI extends Record<infer R, any> ? R : never
>(input: TI): z.ZodEnum<[R, ...R[]]> {
  const [firstKey, ...otherKeys] = Object.keys(input) as [R, ...R[]];
  return z.enum([firstKey, ...otherKeys]);
}

export type Bip21URI = {
    uri: string,
    scheme: string;
    path: string;
    query: string;
    params: {[key:string]:string};
}

export function parseBip21URI(uriString:string):Bip21URI {
  const regex = /^(?:([^:/?#]+):)?(?:\/\/([^/?#]*))?([^?#]*)(?:\?([^#]*))?(?:#(.*))?/;
  const match = uriString.match(regex);
  
  if (!match) {
    throw new Error('Invalid URI');
  }

  let URI:Bip21URI = {
    uri: uriString,
    scheme: match[1] || '',
    path: match[3] || '',
    query: match[4] || '',
    params: {},
  }

  if (URI.query) {
    URI.params = Object.fromEntries(
      match[4].split('&').map(pair => pair.split('=').map(decodeURIComponent))
    );
  }

  return URI;
}