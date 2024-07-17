"use client";
import { useState, useEffect } from "react";
import * as doh from "../../lib/dnssec-prover/doh_lookup.js";
import Bip353Box from "../components/Bip353Box";
import type { Bip353, Bip21URI } from "@/lib/util/index.js";
import CopyUserLinkButton from "./CopyUserLinkButton";
import CopyBip353Button from "./CopyBip353Button";
import Button from "../components/Button";
import { parseBip21URI } from "@/lib/util/index";
import PaymentDetail from "../components/PaymentDetail";

export default function UserDetails(props: Bip353) {
  const [userNameCheck, setUserNameCheck] = useState<any>({});
  const [uri, setURI] = useState<Bip21URI | null>(null);
  const [validPayCode, setValidPayCode] = useState<boolean | null>(null);
  const [multipleRecords, setMultipleRecords] = useState<boolean>(false);

  const checkUserName = () => {
    doh
      .lookup_doh(
        `${props.user}.user._bitcoin-payment.${props.domain}`,
        "TXT",
        "https://dns.google/dns-query"
      )
      .then((response) => {
        console.log(response);
        let validation = JSON.parse(response);
        setUserNameCheck(validation);

        if (validation.valid_from && validation.verified_rrs.length === 1) {
          setValidPayCode(true);
          let parsedURI = parseBip21URI(validation.verified_rrs[0].contents);
          console.log(parsedURI);
          setURI(parsedURI);
        } else if (
          validation.valid_from &&
          validation.verified_rrs.length > 1
        ) {
          setValidPayCode(false);
          setMultipleRecords(true);
        } else setValidPayCode(false);
      });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      checkUserName();
    }, 0);
    return () => clearTimeout(timer); // Cleanup in case the component unmounts
  }, []);

  return (
    <>
      <h1 className="text-left">
        {validPayCode ? "Valid" : "Invalid"} Paycode
      </h1>
      <Bip353Box user={props.user} domain={props.domain} />
      <div className="flex flex-row gap-4">
        <CopyUserLinkButton
          link={"https://twelve.cash/" + props.user + "@" + props.domain}
        />
        <CopyBip353Button user={props.user} domain={props.domain} />
      </div>
      <div className="flex flex-col gap-4 pt-8">
        <h2 className="h3 text-left">Payment Details</h2>
        {uri ? (
          <dl className="flex flex-col gap-4">
            <PaymentDetail label={"All Data"} value={uri.uri} uri={uri.uri} />
            {uri.path ? (
              <PaymentDetail
                label={"Onchain"}
                value={uri.path}
                uri={"bitcoin:" + uri.path}
              />
            ) : (
              ``
            )}
            {Object.entries(uri?.params).map(([key, value]) => {
              let prettyKey = key;
              let prettyUri = uri.uri;

              switch (key) {
                case "lno":
                  prettyKey = "Offer";
                  prettyUri = `bitcoin:?lno=${value}`;
                  break;
                case "sp":
                  prettyKey = "Silent Payment";
                  prettyUri = `bitcoin:?sp=${value}`;
                  break;
                case "label":
                  prettyKey = "Label";
                  break;
                case "lnurl":
                  prettyKey = "LNURL";
                  prettyUri = `lightning:${value}`;
                  break;
              }
              return (
                <PaymentDetail
                  label={prettyKey}
                  value={value}
                  uri={prettyUri}
                  key={key}
                />
              );
            })}
          </dl>
        ) : (
          ``
        )}
      </div>
    </>
  );
}
