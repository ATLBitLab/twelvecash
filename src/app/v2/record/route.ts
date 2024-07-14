import { Bip21Dict, createBip21, getZodEnumFromObjectKeys } from "@/lib/util";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
const axios = require("axios").default;

const Custom = z.object({
  prefix: z.string(),
  value: z.string(),
});

const domainMap = JSON.parse(process.env.DOMAINS!);

const Payload = z
  .object({
    userName: z.string(),
    domain: getZodEnumFromObjectKeys(domainMap),
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

const config = {
  method: "POST",
  headers: {
    Content_Type: "application/json",
    Authorization: `Bearer ${process.env.CF_TOKEN}`,
  },
};

export async function POST(req: NextRequest) {
  const payload = await req.json();
  const result = Payload.safeParse(payload);
  if (!result.success) {
    return NextResponse.json(
      { error: { message: "Invalid request", errors: result.error.issues } },
      { status: 400 }
    );
  }

  const bip21Dict: Bip21Dict = {
    onChain: payload.onChain,
    lno: payload.lno,
    sp: payload.sp,
    custom: payload.custom,
  };

  let bip21: string;
  try {
    bip21 = createBip21(bip21Dict);
  } catch (e: any) {
    return NextResponse.json(
      {
        error: {
          message: "Failed to create bip21 URI",
          errors: [{ message: e.message }],
        },
      },
      { status: 400 }
    );
  }

  // Begin assembling DNS name
  const fullName = process.env.NETWORK
    ? payload.userName + ".user._bitcoin-payment." + process.env.NETWORK
    : payload.userName + ".user._bitcoin-payment";

  const data = {
    content: bip21,
    name: `${fullName}.${payload.domain}`,
    proxied: false,
    type: "TXT",
    comment: "Twelve Cash User DNS Update",
    ttl: 3600,
  };

  try {
    const CF_URL = `https://api.cloudflare.com/client/v4/zones/${
      domainMap[payload.domain]
    }/dns_records/`;
    const res = await axios.post(CF_URL, data, config);
    console.debug(res.data);
  } catch (error: any) {
    let message = "Failed to create Paycode.";
    if (error.response.data.errors[0].code === 81058) {
      message = "Name is already taken.";
    }
    return NextResponse.json(
      {
        error: {
          message: "Failed to update DNS record",
          errors: [{ message: message }],
        },
      },
      { status: 400 }
    );
  }

  return NextResponse.json(
    { message: "Bip353 Address Created" },
    { status: 201 }
  );
}
