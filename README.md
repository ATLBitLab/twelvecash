# Twelve Cash

> :warning: **Caution:** This is alpha software. Seeking feedback and reviews.

This is an attempt to encode bitcoin payment instructions, specifically BOLT 12 offers, into DNS records. For users, this means something that looks like `my-name@twelve.cash`, but resolves to a BOLT12 offer when a BOLT12 supporting wallet attempts to pay to it.

This work was inspired by Bastien Teinturier's post [Lightning Address in a Bolt 12 world](https://lists.linuxfoundation.org/pipermail/lightning-dev/2023-November/004204.html). From there, we have incorporated further ideas from Matt Corallo and Bastien Teinturier's BIP Draft for [DNS Payment Instructions](https://github.com/bitcoin/bips/pull/1551/files).

This does not currently support DNSSEC as outlined in the BIP draft, but adding that is part of our roadmap.

## How to Use

### Create a User Name

Hit the API endpoint `https://twelve.cash/record` with a POST request containing the payload:

```
{
    "localPart": "satoshi",
    "bolt12": "lno1...9uuq"
}
```

### Lookup a User Name

You can verify that this worked by opening a shell and running:

`dig txt satoshi.user._bitcoin-payment.twelve.cash`

The expected output should be:

`satoshi.user._bitcoin-payment.twelve.cash. 3600 IN TXT "bitcoin:?b12=lno1pgtyymmvwscnygzsv9uk6etwwssyzerywfjhxuckyypme4su43qu44v09r28p6whddr62zkyuj68ha68kky2za4zrdu9uuq"`

## Roadmap

- [x] Create [API](https://github.com/ATLBitLab/twelvecash/blob/main/src/app/record/route.ts) for adding bitcoin payment instructions to DNS records
- [x] Create [Web UI](https://twelve.cash) for creating user names
- [x] Integrate API into popular bitcoin wallet - [Zeus](https://github.com/atlbitlab/zeus)
- [ ] Add support for DNSSEC
- [ ] Follow [BIP Draft](https://github.com/bitcoin/bips/pull/1551/files) progress and update TwelveCash as the spec matures
- [ ] Create easy way for users to edit/update their Twelve Cash user name

## Development

Create a personal access token on Digital Ocean and add it to .env.local

Add digital ocean nameservers to your domain
https://docs.digitalocean.com/products/networking/dns/getting-started/dns-registrars/

Add your domain to Digital Ocean
https://docs.digitalocean.com/products/networking/dns/how-to/add-domains/#add-a-domain-using-the-control-panel

Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.