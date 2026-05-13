import { z } from "zod";

export type TwelveCashDomain = string;

const Custom = z.object({
  prefix: z.string(),
  value: z.string(),
});

const createDomainSchema = (domains: readonly string[]) =>
  z.string().refine((domain) => domains.includes(domain), {
    message: "Please choose a valid domain.",
  });

const withPaymentOptionRequirement = <T extends z.ZodTypeAny>(schema: T) =>
  schema.refine(
    (data: z.infer<T>) =>
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

export const createRandomPayCodeInput = (domains: readonly string[]) =>
  withPaymentOptionRequirement(
    z.object({
      domain: createDomainSchema(domains),
      onChain: z.string().optional(),
      label: z.string().optional(),
      lno: z
        .union([z.string().startsWith("lno"), z.string().length(0)])
        .optional(),
      sp: z.union([z.string().startsWith("sp"), z.string().length(0)]).optional(),
      lnurl: z.string().optional(),
      custom: z.array(Custom).optional(),
    })
  );

export const createPayCodeInput = (domains: readonly string[]) =>
  withPaymentOptionRequirement(
    z.object({
      userName: z
        .string()
        .min(4)
        .regex(/^[a-zA-Z0-9._-]+$/, {
          message: "Accepted characters are: a-z, A-Z, 0-9, '.', '-', and '_'",
        }),
      domain: createDomainSchema(domains),
      onChain: z.string().optional(),
      label: z.string().optional(),
      lno: z
        .union([z.string().startsWith("lno"), z.string().length(0)])
        .optional(),
      sp: z.union([z.string().startsWith("sp"), z.string().length(0)]).optional(),
      lnurl: z.string().optional(),
      custom: z.array(Custom).optional(),
    })
  );
