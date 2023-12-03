import { NextResponse } from "next/server";
const axios = require("axios").default;

const DOMAIN = "bolt12.me";
const DO_URL = `https://api.digitalocean.com/v2/domains/${DOMAIN}/records`;

export async function POST(req: Request) {
  // console.debug(process.env.DO_API_KEY);
  // console.debug("req", req);
  const data = {
    type: "TXT",
    name: "chad",
    data: "lno1qqx2n6mw2fh2...",
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
  return NextResponse.json({ message: "hi" });
}
