import { NextRequest, NextResponse } from "next/server";
const axios = require("axios").default;

const DO_URL = `https://api.digitalocean.com/v2/domains/${process.env.DOMAIN}/records`;

export async function POST(req: NextRequest) {
  let localPart: string, bolt12: string;
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

  const config = {
    headers: { Authorization: `Bearer ${process.env.DO_TOKEN}` },
  };

  const fullName = process.env.NETWORK
    ? localPart + ".user._bitcoin-payment." + process.env.NETWORK
    : localPart + ".user._bitcoin-payment";

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
    data: "bitcoin:b12=" + bolt12,
    priority: null,
    port: null,
    ttl: 3600,
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
