import { NextRequest, NextResponse } from "next/server";
import { ZodError, z } from "zod";
const axios = require("axios").default;

const DOMAINS = ["twelve.cash"] as const;
const DomainEnums = z.enum(DOMAINS);

const Custom = z.object({
  prefix: z.string(),
  value: z.string(),
});

const Payload = z
  .object({
    username: z.string(),
    domain: DomainEnums,
    onChain: z.string().optional(),
    label: z.string().optional(),
    lno: z.string().optional(),
    sp: z.string().optional(),
    custom: z.array(Custom).optional(),
  })
  .refine(
    (data) =>
      data.onChain ||
      data.lno ||
      data.sp ||
      (Array.isArray(data.custom) && data.custom.length > 0),
    {
      message: "At least one payment option is required",
      path: [],
    }
  );

const CF_URL = `https://api.cloudflare.com/client/v4/zones/${process.env.CF_DOMAIN_ID}/dns_records/`;

const config = {
  method: "POST",
  headers: {
    Content_Type: "application/json",
    Authorization: `Bearer ${process.env.CF_TOKEN}`,
  },
};

// max character length 2048
export async function POST(req: NextRequest) {
  const json = await req.json();
  const result = Payload.safeParse(json);
  if (!result.success) {
    return NextResponse.json({ errors: result.error.issues }, { status: 400 });
  }

  const { username, domain, onChain, lno, sp, custom } = json;
  console.debug("username", username);
  console.debug("domain", domain);
  console.debug("onChain", onChain);
  console.debug("lno", lno);
  console.debug("sp", sp);
  console.debug("custom", custom);

  // Begin assembling DNS name
  const fullName = process.env.NETWORK
    ? username + ".user._bitcoin-payment." + process.env.NETWORK
    : username + ".user._bitcoin-payment";

  console.debug("fullName", fullName);

  // const data = {
  //   // content: "bitcoin:?lno=" + bip21,
  //   // content: bip21,
  //   name: `${fullName}.${process.env.DOMAIN}`,
  //   proxied: false,
  //   type: "TXT",
  //   comment: "Twelve Cash User DNS Update",
  //   ttl: 3600,
  // };

  return NextResponse.json({ message: "success!" }, { status: 201 });
}
