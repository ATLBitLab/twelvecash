import { Content } from "next/font/google";
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

  // Digital Ocean
  if(process.env.PROVIDER !== "cloudflare") {
    const DO_URL = `https://api.digitalocean.com/v2/domains/${process.env.DOMAIN}/records`;
    const config = {
      headers: { Authorization: `Bearer ${process.env.DO_TOKEN}` },
    };

    
    const queryParams = `?type=TXT&name=${fullName}.${process.env.DOMAIN}`;
    const query = `${DO_URL}${queryParams}`;

    try {
      const res = await axios.get(query, config);
      console.debug("query res.data", res.data);
      console.debug("query res.data.domain_records", res.data.domain_records);
      if (
        res.data.domain_records.length !== 0 &&
        res.data.domain_records[0].name === localPart
      ) {
        return NextResponse.json({ message: "Name is taken." }, { status: 409 });
      }
    } catch (error: any) {
      console.error("error", error);
      return NextResponse.json(
        {
          message: "Failed to create Paycode.",
        },
        { status: 400 }
      );
    }

    const data = {
      type: "TXT",
      name: fullName,
      data: "bitcoin:?lno=" + bolt12,
      priority: null,
      port: null,
      ttl: 1800,
      weight: null,
      flags: null,
      tag: null,
    };

    try {
      const res = await axios.post(DO_URL, data, config);
      console.debug(res.data);
    } catch (error: any) {
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
  // Cloudflare
  else {
    const CF_URL = `https://api.cloudflare.com/client/v4/zones/${process.env.CF_DOMAIN_ID}/dns_records/`;
    
    const config = {
      method: "POST",
      headers: {
        Content_Type: "application/json",
        Authorization: `Bearer ${process.env.CF_TOKEN}`
      }
    };

    const data = {
      content: "bitcoin:?lno=" + bolt12,
      name: `${fullName}.${process.env.DOMAIN}`,
      proxied: false,
      type: "TXT",
      comment: "Twelve Cash User DNS Update",
      ttl: 3600
    };

    try {
      const res = await axios.post(CF_URL, data, config);
      console.debug(res.data);
    } catch (error: any) {
      let message = "Failed to create Paycode."
      if(error.response.data.errors[0].code === 81058) {
          message = "Name is already taken."
      }
      return NextResponse.json(
        
        { message: message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Bolt12 Address Created" },
      { status: 201 }
    );
  }
}
