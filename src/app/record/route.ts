import { NextRequest, NextResponse } from "next/server";
const axios = require("axios").default;

const DOMAIN = "bolt12.me";
const DO_URL = `https://api.digitalocean.com/v2/domains/${DOMAIN}/records`;

export async function POST(req: NextRequest) {
  let localPart: string, bolt12: string;
  try {
    const json = await req.json();
    console.debug("json", json);
    if (!json.localPart || !json.bolt12)
      return NextResponse.json(
        { error: "Missing parameters" },
        { status: 400 }
      );
    localPart = json.localPart;
    bolt12 = json.bolt12;
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  console.debug("localPart", localPart, "bolt12", bolt12);

  // validate localPart, validate bolt12...

  const data = {
    type: "TXT",
    name: localPart,
    data: bolt12,
    priority: null,
    port: null,
    ttl: 1800,
    weight: null,
    flags: null,
    tag: null,
  };

  const config = {
    headers: { Authorization: `Bearer ${process.env.DO_TOKEN}` },
  };
  axios
    .post(DO_URL, data, config)
    .then(function (response) {
      // handle success
      // console.log(response);
      console.debug(response.status, response.statusText, response.message);
    })
    .catch(function (error) {
      // handle error
      console.log(error);
    })
    .finally(function () {
      // always executed
    });

  return NextResponse.json(
    { message: "Bolt12 Address Created" },
    { status: 201 }
  );
}
