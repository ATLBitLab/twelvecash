# AGENTS.md - Twelve Cash

Agent-specific documentation for working on Twelve Cash.

## Project Overview

**Twelve Cash** is a BIP-353 implementation that encodes Bitcoin payment instructions (BOLT12 offers, on-chain addresses, LNURLs) into DNS TXT records. Users get human-readable payment addresses like `alice@twelve.cash` that resolve to their Bitcoin payment details via DNSSEC-validated DNS lookups.

**Live site:** https://twelve.cash

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Package Manager | **pnpm** (v9.15.2+) |
| Database | PostgreSQL via Prisma ORM |
| API | tRPC |
| Styling | Tailwind CSS |
| DNS Provider | Cloudflare API |
| Auth | JWT-based (via @moneydevkit/nextjs) |

## Getting Started

```bash
# Install dependencies
pnpm install

# Start the database (Docker required)
./start-database.sh

# Generate Prisma client and push schema
pnpm postinstall
pnpm db:push

# Start development server
pnpm dev
```

Open http://localhost:3000

## Project Structure

```
src/
├── app/           # Next.js App Router pages and API routes
│   ├── record/    # V2 API endpoint for creating payment records
│   └── ...
├── components/    # React components
├── lib/           # Shared utilities
├── server/        # tRPC routers and server-side code
└── styles/        # Global CSS
prisma/
└── schema.prisma  # Database schema
public/            # Static assets
```

## Key Files

- `src/app/record/route.ts` - Main API endpoint for DNS record creation
- `prisma/schema.prisma` - Database models
- `.env.sample` - Required environment variables

## Environment Variables

Copy `.env.sample` to `.env` and configure:

- `DATABASE_URL` - PostgreSQL connection string
- `CLOUDFLARE_API_TOKEN` - API token with DNS edit permissions
- `CLOUDFLARE_ZONE_ID` - Zone ID for your domain
- `JWT_SECRET` - Secret for JWT token signing

## Common Tasks

### Run Tests
```bash
pnpm test
```

### Database Operations
```bash
pnpm db:push      # Push schema changes (dev)
pnpm db:migrate   # Run migrations (prod)
pnpm db:studio    # Open Prisma Studio GUI
pnpm db:reset     # Reset database (caution!)
```

### Linting
```bash
pnpm lint
```

## BIP-353 Basics

Payment addresses follow the format: `username@domain.com`

These resolve via DNS TXT records at: `username.user._bitcoin-payment.domain.com`

The TXT record contains a Bitcoin URI with payment instructions:
```
bitcoin:?lno=<bolt12_offer>&sp=<silent_payment>&b=<onchain_address>
```

## API Reference

### Create Payment Record
```
POST /v2/record
Content-Type: application/json

{
  "domain": "twelve.cash",
  "lno": "lno1...",           // BOLT12 offer (optional)
  "sp": "sp1...",             // Silent payment address (optional)
  "onChain": "bc1...",        // On-chain address (optional)
  "custom": [                  // Custom fields (optional)
    { "prefix": "lnurl", "value": "lnurl1..." }
  ]
}
```

## Documentation Maintenance

**Important:** When making major changes to the codebase:

1. Update this `AGENTS.md` file with relevant changes
2. Update the corresponding Cursor rules in `.cursor/rules/`
3. Keep documentation in sync with actual implementation

This ensures future AI agents (and human developers) have accurate context.

## Links

- [BIP-353 Draft](https://github.com/bitcoin/bips/pull/1551)
- [DNSSEC Prover](https://github.com/TheBlueMatt/dnssec-prover)
- [Cloudflare DNSSEC Docs](https://developers.cloudflare.com/dns/dnssec/)
