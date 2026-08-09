# Manual production migrations

The production database predates a checked-in Prisma migration history and has
been managed with `prisma db push`. Do not create a synthetic
`prisma/migrations` baseline and run it against that database.

## Pay-code checkout reservations (2026-08-09)

Apply the expand migration before deploying code that uses `checkoutId` or
`reservationExpiresAt`:

```bash
pnpm db:manual-migrations
```

Local development needs this too — run it after `pnpm db:push`. `db:push` only knows
about `prisma/schema.prisma`, so without this step the live-name index is missing and
concurrent reservations of the same custom username are not serialized.

The command uses `DATABASE_URL`. Take the normal production backup first. The
SQL is idempotent, adds both nullable columns, expires legacy PENDING rows that
have no server-verifiable checkout, and creates:

- a unique index for checkout IDs; and
- a partial unique index on `lower(userName), lower(domain)` for PENDING and
  ACTIVE rows.

"Legacy" means **both** `checkoutId` and `reservationExpiresAt` are NULL. A row
with a lease but no checkout id is a live `createPayCode` call that has claimed
the name and is waiting on MDK, so it is left alone. Matching on `checkoutId IS
NULL` alone would expire that row mid-flight on a rerun against a live database;
the request would then complete and hand out a payable URL for a row redemption
will reject. Rerunning this file against a live database is safe.

The script deliberately aborts rather than choosing a winner if live rows
already collide case-insensitively. It also aborts if a partially deployed
checkout row has a checkout ID but no reservation expiry; reconcile that row
against the checkout's MDK `expiresAt` before retrying. Inspect collisions with:

```sql
SELECT LOWER("userName") AS username,
       LOWER("domain") AS domain,
       ARRAY_AGG("id" ORDER BY "createdAt") AS pay_code_ids
FROM "PayCode"
WHERE "status" IN ('PENDING', 'ACTIVE')
GROUP BY LOWER("userName"), LOWER("domain")
HAVING COUNT(*) > 1;
```

Resolve each collision according to the payment/DNS record of truth, then run
the migration again. Verify the installed indexes with:

```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = current_schema()
  AND tablename = 'PayCode'
  AND indexname IN ('PayCode_checkoutId_key', 'PayCode_live_name_key');
```

The live-name index is intentionally SQL-managed because Prisma 5 cannot
express this partial expression index. Do not remove it during later schema
reconciliation.
