import { NextRequest, NextResponse } from "next/server";
const axios = require("axios").default;

export async function POST(req: NextRequest) {
  let localPart: string, bolt12: string;

  // Check for errors
  try {
    const json = await req.json();
    console.debug("json", json);
    // validate localPart, validate bolt12...
    if (!json.localPart || !json.bolt12)
      return NextResponse.json(
        { error: "Missing parameters" },
        { status: 400 }
      );
    localPart = json.localPart;
    bolt12 = json.bolt12;
    console.debug("localPart", localPart, "bolt12", bolt12);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  // Begin assembling DNS name
  const fullName = process.env.NETWORK
    ? localPart + ".user._bitcoin-payment." + process.env.NETWORK
    : localPart + ".user._bitcoin-payment";

  // First do a DoH lookup to see if a TXT record exists for the given name
  try {
    const res = await axios.get(
      `https://cloudflare-dns.com/dns-query?name=${fullName}.${process.env.DOMAIN}&type=txt`,
      {
        headers: {
          Accept: "application/dns-json",
        },
      }
    );
    // Answer is an array if there are records, undefined otherwise
    if (res.data.Answer)
      return NextResponse.json(
        { message: "Name is already taken." },
        { status: 409 }
      );
  } catch (e: any) {
    return NextResponse.json(
      { message: "Failed to lookup paycode." },
      { status: 400 }
    );
  }

  const CF_URL = `https://api.cloudflare.com/client/v4/zones/${process.env.CF_DOMAIN_ID}/dns_records/`;

  const config = {
    method: "POST",
    headers: {
      Content_Type: "application/json",
      Authorization: `Bearer ${process.env.CF_TOKEN}`,
    },
  };

  const data = {
    content: "bitcoin:?lno=" + bolt12,
    name: `${fullName}.${process.env.DOMAIN}`,
    proxied: false,
    type: "TXT",
    comment: "Twelve Cash User DNS Update",
    ttl: 3600,
  };

  try {
    const res = await axios.post(CF_URL, data, config);
    console.debug(res.data);
  } catch (error: any) {
    if (error.response.data.errors[0].code === 81058) {
      return NextResponse.json(
        { message: "Name is already taken." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { message: "Failed to create Paycode." },
      { status: 400 }
    );
  }

  return NextResponse.json(
    { message: "Bolt12 Address Created" },
    { status: 201 }
  );
}
