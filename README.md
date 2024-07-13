![Twelve Cash](https://twelve.cash/twelve-cash-hero.webp)

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

`satoshi.user._bitcoin-payment.twelve.cash. 3600 IN TXT "bitcoin:?lno=lno1pgtyymmvwscnygzsv9uk6etwwssyzerywfjhxuckyypme4su43qu44v09r28p6whddr62zkyuj68ha68kky2za4zrdu9uuq"`

## Validate a User Name

For this, we rely on the [dnssec-prover tool](https://github.com/TheBlueMatt/dnssec-prover) from TheBlueMatt. THis (or something like it) should be built into any tool that facilitates payments to Twelve Cash addresses. However, we have exposed this on our website frontend so you can experiment and validate these addresses.

## Roadmap

- [x] Create [API](https://github.com/ATLBitLab/twelvecash/blob/main/src/app/record/route.ts) for adding bitcoin payment instructions to DNS records
- [x] Create [Web UI](https://twelve.cash) for creating user names
- [x] Integrate API into popular bitcoin wallet - [Zeus](https://github.com/atlbitlab/zeus)
- [x] Add support for DNSSEC
- [x] Follow [BIP Draft](https://github.com/bitcoin/bips/pull/1551/files) progress and update TwelveCash as the spec matures
- [ ] Create easy way for users to edit/update their Twelve Cash user name

## Development

You can use this tool with Cloudflare or Digital OCean DNS. However, if you want to properly implement human-readable addresses BIP, you will need to use Cloudflare sicne they support DNSSEC.

### Cloudflare

- Setup your domain with DNSSEC - [Docs](https://developers.cloudflare.com/dns/dnssec/)
- Create an API token in Cloudflare, giving it access to your domain name
- In the .env file, set `PROVIDER="cloudflare"` and add your Cloudflare API token and domain ID (which you can find by clicking on your domain name in Cloudflare and scrolling down the page)

### Digital Ocean

- Create a personal access token on Digital Ocean and add it to .env.local
- In the .env file, set `PROVIDER="digitalocean"` and add your Digital Ocean API token

### Running the Dev Server

Run the development server:

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
