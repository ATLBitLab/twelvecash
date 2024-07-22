import axios from "axios";
import https from "https";

const LND_HOST = process.env.LND_HOST!;
const LND_PORT = process.env.LND_PORT!;
const MACAROON = process.env.LND_MACAROON!;
const TLS_CERT = process.env.LND_TLS_CERT!;

const getAxiosInstance = () => {
  return axios.create({
    baseURL: `${LND_HOST}:${LND_PORT}`,
    headers: {
      "Grpc-Metadata-macaroon": Buffer.from(MACAROON, "base64").toString("hex"),
    },
    httpsAgent: new https.Agent({
      ca: Buffer.from(TLS_CERT, "base64").toString("ascii"),
    }),
  });
};
// const axiosInstance = axios.create({
//   baseURL: `${LND_HOST}:${LND_PORT}`,
//   headers: {
//     "Grpc-Metadata-macaroon": Buffer.from(MACAROON, "base64").toString("hex"),
//   },
//   httpsAgent: new https.Agent({
//     ca: Buffer.from(TLS_CERT, "base64").toString("ascii"),
//   }),
// });

// Console output:
//  {
//    "r_hash": <string>, // <bytes>
//    "payment_request": <string>, // <string>
//    "add_index": <string>, // <uint64>
//    "payment_addr": <string>, // <bytes>
//  }
export async function createInvoice(amount: number, memo: string) {
  const axiosInstance = getAxiosInstance();
  try {
    const response = await axiosInstance.post("/v1/invoices", {
      value_msat: amount,
      memo: memo,
    });
    const rHashHex = Buffer.from(response.data.r_hash, "base64").toString(
      "hex"
    );

    console.debug("response", response);
    return {
      ...response.data,
      r_hash: rHashHex,
    };
  } catch (error) {
    console.error("Error creating invoice:", error);
    throw error;
  }
}

export async function lookupInvoice(paymentHash: string) {
  const axiosInstance = getAxiosInstance();
  try {
    const response = await axiosInstance.get(`/v1/invoice/${paymentHash}`);
    return response.data;
  } catch (error) {
    console.error("Error looking up invoice:", error);
    throw error;
  }
}
