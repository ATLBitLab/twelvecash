-- Twelve Cash currently has an unbaselined production database managed with
-- `prisma db push`. This idempotent expand migration is intentionally kept out
-- of prisma/migrations so `prisma migrate deploy` does not try to replay an
-- invented initial history against that database.
--
-- Run this file before deploying application code that reads checkoutId or
-- reservationExpiresAt. The transaction takes a write lock while it validates
-- and installs the live-name uniqueness constraint.

BEGIN;

ALTER TABLE "PayCode"
  ADD COLUMN IF NOT EXISTS "checkoutId" TEXT,
  ADD COLUMN IF NOT EXISTS "reservationExpiresAt" TIMESTAMP(3);

-- Pre-server-verification PENDING rows have no payment proof and cannot be
-- redeemed by the new code. Release them before creating the live-name index.
UPDATE "PayCode"
SET "status" = 'EXPIRED', "updatedAt" = CURRENT_TIMESTAMP
WHERE "status" = 'PENDING' AND "checkoutId" IS NULL;

-- A partial deployment of the server-verification PR may already have payable
-- checkouts but no locally recorded lease expiry. Those must be reconciled
-- against MDK rather than assigned an arbitrary expiry in SQL.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "PayCode"
    WHERE "status" = 'PENDING'
      AND "checkoutId" IS NOT NULL
      AND "reservationExpiresAt" IS NULL
  ) THEN
    RAISE EXCEPTION 'paid PayCode reservations are missing reservationExpiresAt'
      USING HINT = 'Reconcile each PENDING checkout with its MDK expiresAt, then rerun this file.';
  END IF;
END $$;

-- Do not guess which already-live record should win. Abort with a useful error
-- so an operator can reconcile conflicting ACTIVE rows before retrying.
DO $$
DECLARE
  duplicate_name TEXT;
BEGIN
  SELECT LOWER("userName") || '@' || LOWER("domain")
  INTO duplicate_name
  FROM "PayCode"
  WHERE "status" IN ('PENDING', 'ACTIVE')
  GROUP BY LOWER("userName"), LOWER("domain")
  HAVING COUNT(*) > 1
  LIMIT 1;

  IF duplicate_name IS NOT NULL THEN
    RAISE EXCEPTION 'duplicate live PayCode name prevents migration: %', duplicate_name
      USING HINT = 'Reconcile the duplicate PENDING/ACTIVE rows, then rerun this file.';
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "PayCode_checkoutId_key"
  ON "PayCode" ("checkoutId");

-- PostgreSQL expression/partial indexes are not representable in this Prisma
-- schema version. This index is the atomic, case-insensitive reservation.
CREATE UNIQUE INDEX IF NOT EXISTS "PayCode_live_name_key"
  ON "PayCode" (LOWER("userName"), LOWER("domain"))
  WHERE "status" IN ('PENDING', 'ACTIVE');

COMMIT;
