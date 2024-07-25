import { PayCodeParamType } from "@prisma/client";
import { bech32 } from "bech32";
import { z } from "zod";
import { Prisma } from "@prisma/client";

export const lnAddrToLNURL = (lnaddr: string) => {
  const [username, domain] = lnaddr.split("@");
  if (!username || !domain)
    throw new Error("Failed to parse lightning address");

  const decodedLnurl = `https://${domain}/.well-known/lnurlp/${username}`;

  let words = bech32.toWords(Buffer.from(decodedLnurl, "utf8"));
  const lnurl = bech32.encode("lnurl", words);
  return lnurl;
};

export type Custom = {
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

// TODO: Fix unit tests
export const createBip21 = (
  onChain?: string,
  label?: string,
  lno?: string,
  sp?: string,
  lnurl?: string,
  custom?: Custom[]
): string => {
  const base = onChain ? `bitcoin:${onChain}` : "bitcoin:";
  const url = new URL(base);

  if (label && onChain) url.searchParams.append("label", label);
  if (lno) url.searchParams.append("lno", lno);
  if (sp) url.searchParams.append("sp", sp);
  if (lnurl) url.searchParams.append("lnurl", lnurl);

  if (Array.isArray(custom)) {
    custom.forEach((item: Custom) => {
      url.searchParams.append(item.prefix, item.value);
    });
  }

  const bip21 = url.toString();
  if (bip21 === "bitcoin:") throw new Error("No payment option provided");
  if (bip21.length > 2048)
    throw new Error("Bip21 URI is greater than 2048 characters");

  return bip21;
};

export const createPayCodeParams = (
  onChain?: string,
  label?: string,
  lno?: string,
  sp?: string,
  lnurl?: string,
  custom?: Custom[]
): Prisma.PayCodeParamCreateWithoutPayCodeInput[] => {
  let create: Prisma.PayCodeParamCreateWithoutPayCodeInput[] = [];
  if (onChain) create.push({ value: onChain, type: PayCodeParamType.ONCHAIN });
  if (label) create.push({ value: label, type: PayCodeParamType.LABEL });
  if (lno) create.push({ value: lno, type: PayCodeParamType.LNO });
  if (sp) create.push({ value: sp, type: PayCodeParamType.SP });
  if (lnurl) create.push({ value: lnurl, type: PayCodeParamType.LNURL });

  if (Array.isArray(custom)) {
    custom.forEach((item: Custom) => {
      create.push({
        prefix: item.prefix,
        value: item.value,
        type: PayCodeParamType.CUSTOM,
      });
    });
  }

  if (create.length == 0) {
    throw new Error("No parameters provided");
  }

  return create;
};

type Param = {
  prefix: string | null;
  value: string;
  type: PayCodeParamType;
};

export const createBip21FromParams = (params: Param[]) => {
  const base = "bitcoin:";
  const url = new URL(base);
  for (let param of params) {
    if (param.type === PayCodeParamType.LABEL)
      url.searchParams.append("label", param.value);
    if (param.type === PayCodeParamType.LNO)
      url.searchParams.append("lno", param.value);
    if (param.type === PayCodeParamType.SP)
      url.searchParams.append("sp", param.value);
    if (param.type === PayCodeParamType.LNURL)
      url.searchParams.append("lnurl", param.value);
    if (param.type === PayCodeParamType.CUSTOM)
      url.searchParams.append(param.prefix!, param.value);

    // lol
    if (param.type === PayCodeParamType.ONCHAIN) {
      const onChainUrl = new URL(`${base}${param.value}`);
      for (let innerParam of params) {
        if (innerParam.type === PayCodeParamType.LABEL)
          url.searchParams.append("label", innerParam.value);
        if (innerParam.type === PayCodeParamType.LNO)
          url.searchParams.append("lno", innerParam.value);
        if (innerParam.type === PayCodeParamType.SP)
          url.searchParams.append("sp", innerParam.value);
        if (innerParam.type === PayCodeParamType.LNURL)
          url.searchParams.append("lnurl", innerParam.value);
        if (innerParam.type === PayCodeParamType.CUSTOM)
          url.searchParams.append(innerParam.prefix!, param.value);
      }
      return onChainUrl.toString();
    }
  }
  return url.toString();
};

export function getZodEnumFromObjectKeys<
  TI extends Record<string, any>,
  R extends string = TI extends Record<infer R, any> ? R : never
>(input: TI): z.ZodEnum<[R, ...R[]]> {
  const [firstKey, ...otherKeys] = Object.keys(input) as [R, ...R[]];
  return z.enum([firstKey, ...otherKeys]);
}

export type Bip21URI = {
  uri: string;
  scheme: string;
  path: string;
  query: string;
  params: { [key: string]: string };
};

export function parseBip21URI(uriString: string): Bip21URI {
  const regex =
    /^(?:([^:/?#]+):)?(?:\/\/([^/?#]*))?([^?#]*)(?:\?([^#]*))?(?:#(.*))?/;
  const match = uriString.match(regex);

  if (!match) {
    throw new Error("Invalid URI");
  }

  let URI: Bip21URI = {
    uri: uriString,
    scheme: match[1] || "",
    path: match[3] || "",
    query: match[4] || "",
    params: {},
  };

  if (URI.query) {
    URI.params = Object.fromEntries(
      match[4].split("&").map((pair) => pair.split("=").map(decodeURIComponent))
    );
  }

  return URI;
}
