import { z } from "zod";

export const DOMAINS = ["twelve.cash", "12cash.dev"] as const;

export type TwelveCashDomains = typeof DOMAINS[number];

const Custom = z.object({
  prefix: z.string(),
  value: z.string(),
});
export const randomPayCodeInput = z
  .object({
    domain: z.enum(DOMAINS),
    onChain: z.string().optional(),
    label: z.string().optional(),
    lno: z
      .union([z.string().startsWith("lno"), z.string().length(0)])
      .optional(),
    sp: z.union([z.string().startsWith("sp"), z.string().length(0)]).optional(),
    lnurl: z.string().optional(),
    custom: z.array(Custom).optional(),
  })
  .refine(
    (data) =>
      data.onChain ||
      data.lno ||
      data.sp ||
      data.lnurl ||
      (Array.isArray(data.custom) && data.custom.length > 0),
    {
      message: "At least one payment option is required",
      path: [],
    }
  );

export const payCodeInput = z
  .object({
    userName: z
      .string()
      .min(4)
      .regex(/^[a-zA-Z0-9._-]+$/, {
        message: "Accepted characters are: a-z, A-Z, 0-9, '.', '-', and '_'",
      }),
    domain: z.enum(DOMAINS),
    onChain: z.string().optional(),
    label: z.string().optional(),
    lno: z
      .union([z.string().startsWith("lno"), z.string().length(0)])
      .optional(),
    sp: z.union([z.string().startsWith("sp"), z.string().length(0)]).optional(),
    lnurl: z.string().optional(),
    custom: z.array(Custom).optional(),
  })
  .refine(
    (data) =>
      data.onChain ||
      data.lno ||
      data.sp ||
      data.lnurl ||
      (Array.isArray(data.custom) && data.custom.length > 0),
    {
      message: "At least one payment option is required",
      path: [],
    }
  );
