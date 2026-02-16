![Twelve Cash](https://twelve.cash/twelve-cash-hero.webp)

# Twelve Cash

This is an attempt to encode bitcoin payment instructions, specifically BOLT 12 offers, into DNS records. For users, this means something that looks like `my-name@twelve.cash`, but resolves to a BOLT12 offer when a BOLT12 supporting wallet attempts to pay to it.

This is an implementation of BIP-353. Inititally inspired by Bastien Teinturier's post [Lightning Address in a Bolt 12 world](https://lists.linuxfoundation.org/pipermail/lightning-dev/2023-November/004204.html).

## How to Use

Twelve Cash offers two ways to create a username:

1. **Free Random Username** - Get a randomly generated username (e.g., `brave.penguin@twelve.cash`)
2. **Custom Username (Paid)** - Choose your own username (e.g., `satoshi@twelve.cash`) for a small Lightning payment

### API Overview

The API uses [tRPC](https://trpc.io/) for type-safe communication. All endpoints are available at:

```
https://twelve.cash/api/trpc/<procedure>
```

### Create a Free Random Username

Create a free username with a randomly generated name (format: `adjective.animal`).

**Procedure:** `payCode.createRandomPayCode`

**Request:**
```json
{
  "domain": "twelve.cash",
  "lno": "lno1pgg8...",
  "sp": "sp1abc...",
  "onChain": "bc1p...",
  "lnurl": "LNURL1DP68...",
  "label": "My Bitcoin Address",
  "custom": [
    { "prefix": "mystory", "value": "Bitcoin fixes this." }
  ]
}
```

**Required:** At least one payment option (`onChain`, `lno`, `sp`, `lnurl`, or `custom`)

**Available domains:** `twelve.cash`, `12cash.dev`

**Response:**
```json
{
  "id": "uuid",
  "userName": "brave.penguin",
  "domain": "twelve.cash",
  "status": "ACTIVE",
  "params": [...]
}
```

### Create a Custom Username (Paid)

Reserve a custom username. This creates a pending paycode that requires payment to activate.

**Procedure:** `payCode.createPayCode`

**Request:**
```json
{
  "userName": "satoshi",
  "domain": "twelve.cash",
  "lno": "lno1pgg8...",
  "onChain": "bc1p..."
}
```

**Username requirements:**
- Minimum 4 characters
- Allowed characters: `a-z`, `A-Z`, `0-9`, `.`, `-`, `_`

**Response:**
```json
{
  "payCodeId": "uuid",
  "userName": "satoshi",
  "domain": "twelve.cash"
}
```

After receiving the response, redirect the user to complete payment via the MDK checkout. Once payment is confirmed, call `redeemPayCode` to activate the username.

### Redeem a Paid Username

Activate a paid username after payment confirmation.

**Procedure:** `payCode.redeemPayCode`

**Request:**
```json
{
  "payCodeId": "uuid"
}
```

**Response:** The activated paycode object with `status: "ACTIVE"`

### Lookup a Username

Verify a username by querying DNS:

```bash
dig txt satoshi.user._bitcoin-payment.twelve.cash
```

Expected output:

```
satoshi.user._bitcoin-payment.twelve.cash. 3600 IN TXT "bitcoin:?lno=lno1pgg8getnw3q8gam9d3mx2tnrv9eks93pqw7dv89vg89dtreg63cwn4mtg7js438yk3alw3a43zshdgsm0p08q"
```

### Get User's Paycodes (Authenticated)

Retrieve all active paycodes for the authenticated user.

**Procedure:** `payCode.getUserPaycodes`

**Requires:** Authentication via Nostr or email

## Validate a Username

For this, we rely on the [dnssec-prover tool](https://github.com/TheBlueMatt/dnssec-prover) from TheBlueMatt. This (or something like it) should be built into any tool that facilitates payments to Twelve Cash addresses. However, we have exposed this on our website frontend so you can experiment and validate these addresses.

## Roadmap

- [x] Create API for adding bitcoin payment instructions to DNS records
- [x] Create [Web UI](https://twelve.cash) for creating usernames
- [x] Integrate API into popular bitcoin wallet - [Zeus](https://github.com/atlbitlab/zeus)
- [x] Add support for DNSSEC
- [x] Follow [BIP Draft](https://github.com/bitcoin/bips/pull/1551/files) progress and update TwelveCash as the spec matures
- [x] Add free random usernames and paid custom usernames
- [x] Add authentication (Nostr + Email via Better Auth)
- [ ] Create easy way for users to edit/update their Twelve Cash username

## Development

You can use this tool with Cloudflare DNS API.

### Cloudflare

- Setup your domain with DNSSEC - [Docs](https://developers.cloudflare.com/dns/dnssec/)
- Create an API token in Cloudflare, giving it access to your domain name
- In the .env file, add your Cloudflare API token and domain ID (which you can find by clicking on your domain name in Cloudflare and scrolling down the page)

### Running the Dev Server

Start up the database:

```bash
./start-database.sh
```

Create the Prisma client and push it to the database:

```bash
pnpm postinstall
pnpm db:push
```

Run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
