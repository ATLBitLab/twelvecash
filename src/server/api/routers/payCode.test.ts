process.env.DOMAINS = JSON.stringify({ "twelve.cash": "zone-1" });

jest.mock("axios", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));
jest.mock("superjson", () => ({
  __esModule: true,
  default: {
    serialize: (value: unknown) => ({ json: value }),
    deserialize: ({ json }: { json: unknown }) => json,
  },
}));
jest.mock("unique-names-generator", () => ({
  adjectives: ["calm"],
  animals: ["badger"],
  uniqueNamesGenerator: jest.fn(),
}));
jest.mock("../../db", () => ({ db: {} }));
jest.mock("../../../lib/notifications", () => ({
  logPayCodeActivity: jest.fn(),
}));
jest.mock("../../mdk", () => {
  const actual = jest.requireActual("../../mdk");
  return {
    ...actual,
    createMdkCheckout: jest.fn(),
    getMdkCheckout: jest.fn(),
  };
});

const axios = require("axios").default as {
  get: jest.Mock;
  post: jest.Mock;
};
const mdk = require("../../mdk") as {
  createMdkCheckout: jest.Mock;
  getMdkCheckout: jest.Mock;
};
const names = require("unique-names-generator") as {
  uniqueNamesGenerator: jest.Mock;
};
const { createCallerFactory } = require("../trpc");
const { payCodeRouter } = require("./payCode");
const createCaller = createCallerFactory(payCodeRouter);
let consoleDebug: jest.SpyInstance;

const input = (userName = "Alice") => ({
  userName,
  domain: "twelve.cash",
  lno: "lno-test",
});

const pendingPayCode = (overrides: Record<string, unknown> = {}) => ({
  id: "pay-code-1",
  userName: "Alice",
  domain: "twelve.cash",
  status: "PENDING",
  checkoutId: "checkout-1",
  reservationExpiresAt: new Date(Date.now() + 60_000),
  params: [{ id: "param-1", prefix: null, value: "lno-test", type: "LNO" }],
  ...overrides,
});

const callerFor = (db: object) =>
  createCaller({
    db,
    user: undefined,
    headers: new Headers(),
  });

beforeEach(() => {
  jest.clearAllMocks();
  consoleDebug = jest
    .spyOn(console, "debug")
    .mockImplementation(() => undefined);
  names.uniqueNamesGenerator.mockReturnValue("calm.badger");
  axios.get.mockResolvedValue({ data: { result: [] } });
  axios.post.mockResolvedValue({ data: { success: true } });
});

afterEach(() => {
  consoleDebug.mockRestore();
});

describe("payCode.createRandomPayCode", () => {
  it("skips an unexpired paid-name reservation and tries another name", async () => {
    names.uniqueNamesGenerator
      .mockReturnValueOnce("reserved.badger")
      .mockReturnValueOnce("fresh.badger");
    const activeRecord = pendingPayCode({
      id: "free-pay-code",
      userName: "fresh.badger",
      status: "ACTIVE",
      checkoutId: null,
    });
    const txPayCode = {
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      findFirst: jest
        .fn()
        .mockResolvedValueOnce(pendingPayCode({ userName: "Reserved.Badger" }))
        .mockResolvedValueOnce(null),
      create: jest.fn().mockResolvedValue(activeRecord),
    };
    const db = {
      $transaction: jest.fn((operation) => operation({ payCode: txPayCode })),
    };

    await expect(
      callerFor(db).createRandomPayCode({
        domain: "twelve.cash",
        lno: "lno-test",
      })
    ).resolves.toMatchObject({
      id: "free-pay-code",
      userName: "fresh.badger",
      status: "ACTIVE",
    });

    expect(names.uniqueNamesGenerator).toHaveBeenCalledTimes(2);
    expect(txPayCode.findFirst).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: expect.objectContaining({
          userName: { equals: "reserved.badger", mode: "insensitive" },
          status: { in: ["ACTIVE", "PENDING"] },
        }),
      })
    );
    expect(txPayCode.create).toHaveBeenCalledTimes(1);
    expect(axios.post).toHaveBeenCalledTimes(1);
  });

  it("never releases a reservation it cannot prove is unpaid", async () => {
    names.uniqueNamesGenerator
      .mockReturnValueOnce("held.badger")
      .mockReturnValueOnce("free.badger");
    const txPayCode = {
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      findFirst: jest
        .fn()
        .mockResolvedValueOnce(
          // Lease long expired, but this path has no way to know whether the
          // holder paid. It must generate a different name, not reclaim.
          pendingPayCode({
            userName: "held.badger",
            reservationExpiresAt: new Date(Date.now() - 60 * 60 * 1000),
          })
        )
        .mockResolvedValueOnce(null),
      create: jest
        .fn()
        .mockResolvedValue(
          pendingPayCode({ userName: "free.badger", status: "ACTIVE" })
        ),
    };
    const db = {
      $transaction: jest.fn((operation) => operation({ payCode: txPayCode })),
    };

    await expect(
      callerFor(db).createRandomPayCode({
        domain: "twelve.cash",
        lno: "lno-test",
      })
    ).resolves.toMatchObject({ userName: "free.badger" });

    expect(txPayCode.updateMany).not.toHaveBeenCalled();
    expect(mdk.getMdkCheckout).not.toHaveBeenCalled();
  });

  it("retries a unique-index race instead of returning a 500", async () => {
    names.uniqueNamesGenerator
      .mockReturnValueOnce("raced.badger")
      .mockReturnValueOnce("winner.badger");
    const activeRecord = pendingPayCode({
      id: "free-pay-code",
      userName: "winner.badger",
      status: "ACTIVE",
      checkoutId: null,
    });
    const txPayCode = {
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest
        .fn()
        .mockRejectedValueOnce({ code: "P2002" })
        .mockResolvedValueOnce(activeRecord),
    };
    const db = {
      $transaction: jest.fn((operation) => operation({ payCode: txPayCode })),
    };

    await expect(
      callerFor(db).createRandomPayCode({
        domain: "twelve.cash",
        lno: "lno-test",
      })
    ).resolves.toMatchObject({ userName: "winner.badger" });

    expect(names.uniqueNamesGenerator).toHaveBeenCalledTimes(2);
    expect(txPayCode.create).toHaveBeenCalledTimes(2);
    expect(axios.post).toHaveBeenCalledTimes(1);
  });
});

describe("payCode.createPayCode", () => {
  it("atomically reserves the name and binds the server-created checkout", async () => {
    const checkoutExpiry = new Date(Date.now() + 60 * 60 * 1000);
    const reserved = pendingPayCode();
    const txPayCode = {
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      create: jest.fn().mockResolvedValue(reserved),
    };
    const db = {
      payCode: {
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        delete: jest.fn(),
      },
      payCodeParam: { deleteMany: jest.fn() },
      $transaction: jest.fn((operation) => operation({ payCode: txPayCode })),
    };
    mdk.createMdkCheckout.mockResolvedValue({
      id: "checkout-1",
      status: "PENDING_PAYMENT",
      expiresAt: checkoutExpiry,
      invoice: null,
    });

    await expect(callerFor(db).createPayCode(input())).resolves.toEqual({
      payCodeId: "pay-code-1",
      userName: "Alice",
      domain: "twelve.cash",
      checkoutUrl: "/checkout/checkout-1",
    });

    expect(mdk.createMdkCheckout).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 5000,
        currency: "SAT",
        metadata: expect.objectContaining({ payCodeId: "pay-code-1" }),
      })
    );
    // The lease becomes the checkout's own expiry. No grace period is added:
    // a fixed grace either robs a paid buyer or hands out a free hold.
    expect(db.payCode.updateMany).toHaveBeenCalledWith({
      where: {
        id: "pay-code-1",
        status: "PENDING",
        reservationExpiresAt: expect.any(Date),
      },
      data: {
        checkoutId: "checkout-1",
        reservationExpiresAt: checkoutExpiry,
      },
    });
  });

  it("refuses the name when an expired reservation was actually paid", async () => {
    // The buyer paid and never came back to redeem. Releasing their name would
    // keep their sats and sell the name to this caller.
    const db = {
      payCode: {
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest
          .fn()
          .mockResolvedValue([{ id: "paid-row", checkoutId: "checkout-paid" }]),
        updateMany: jest.fn(),
        delete: jest.fn(),
      },
      payCodeParam: { deleteMany: jest.fn() },
      $transaction: jest.fn(),
    };
    mdk.getMdkCheckout.mockResolvedValue({
      id: "checkout-paid",
      status: "EXPIRED",
      expiresAt: new Date(Date.now() - 60_000),
      invoice: { amountSatsReceived: 5000 },
    });

    await expect(callerFor(db).createPayCode(input())).rejects.toMatchObject({
      code: "CONFLICT",
    });
    expect(db.$transaction).not.toHaveBeenCalled();
    expect(mdk.createMdkCheckout).not.toHaveBeenCalled();
  });

  it("keeps the name reserved while MDK still calls the checkout live", async () => {
    // Our local lease elapsed but MDK has not declared the checkout dead, so the
    // invoice may still settle. A local clock is not authority to kill it.
    const db = {
      payCode: {
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest
          .fn()
          .mockResolvedValue([{ id: "live-row", checkoutId: "checkout-live" }]),
        updateMany: jest.fn(),
        delete: jest.fn(),
      },
      payCodeParam: { deleteMany: jest.fn() },
      $transaction: jest.fn(),
    };
    mdk.getMdkCheckout.mockResolvedValue({
      id: "checkout-live",
      status: "PENDING_PAYMENT",
      expiresAt: new Date(Date.now() - 60_000),
      invoice: { amountSatsReceived: 0 },
    });

    await expect(callerFor(db).createPayCode(input())).rejects.toMatchObject({
      code: "CONFLICT",
    });
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("releases an expired reservation only once MDK reports it terminally unpaid", async () => {
    const checkoutExpiry = new Date(Date.now() + 60 * 60 * 1000);
    const reserved = pendingPayCode();
    const txPayCode = {
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      create: jest.fn().mockResolvedValue(reserved),
    };
    const db = {
      payCode: {
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest
          .fn()
          .mockResolvedValue([{ id: "dead-row", checkoutId: "checkout-dead" }]),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        delete: jest.fn(),
      },
      payCodeParam: { deleteMany: jest.fn() },
      $transaction: jest.fn((operation) => operation({ payCode: txPayCode })),
    };
    mdk.getMdkCheckout.mockResolvedValue({
      id: "checkout-dead",
      status: "EXPIRED",
      expiresAt: new Date(Date.now() - 60_000),
      invoice: { amountSatsReceived: 0 },
    });
    mdk.createMdkCheckout.mockResolvedValue({
      id: "checkout-1",
      status: "PENDING_PAYMENT",
      expiresAt: checkoutExpiry,
      invoice: null,
    });

    await expect(callerFor(db).createPayCode(input())).resolves.toMatchObject({
      payCodeId: "pay-code-1",
    });

    // The release must re-assert every fact the sweep judged it on, including
    // the observed checkoutId — the row may have been finalized since the read.
    expect(txPayCode.updateMany).toHaveBeenCalledWith({
      where: {
        id: "dead-row",
        status: "PENDING",
        reservationExpiresAt: { lte: expect.any(Date) },
        checkoutId: "checkout-dead",
      },
      data: { status: "EXPIRED" },
    });
  });

  it("fails closed when an expired reservation cannot be verified with MDK", async () => {
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const db = {
      payCode: {
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest
          .fn()
          .mockResolvedValue([{ id: "row", checkoutId: "checkout-x" }]),
        updateMany: jest.fn(),
        delete: jest.fn(),
      },
      payCodeParam: { deleteMany: jest.fn() },
      $transaction: jest.fn(),
    };
    mdk.getMdkCheckout.mockRejectedValue(new Error("MDK unreachable"));

    await expect(callerFor(db).createPayCode(input())).rejects.toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
    });
    expect(db.$transaction).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("does not hand back a checkout URL if the reservation was lost meanwhile", async () => {
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const txPayCode = {
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      create: jest.fn().mockResolvedValue(pendingPayCode()),
    };
    const db = {
      payCode: {
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
        // The row is no longer PENDING with its original lease — a migration
        // rerun or a sweep took it while MDK was working.
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        delete: jest.fn(),
      },
      payCodeParam: { deleteMany: jest.fn() },
      $transaction: jest.fn((operation) => operation({ payCode: txPayCode })),
    };
    mdk.createMdkCheckout.mockResolvedValue({
      id: "checkout-1",
      status: "PENDING_PAYMENT",
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      invoice: null,
    });

    await expect(callerFor(db).createPayCode(input())).rejects.toMatchObject({
      code: "CONFLICT",
    });
    consoleError.mockRestore();
  });

  it("lets only one case-insensitive concurrent reservation reach MDK", async () => {
    const reservedNames = new Set<string>();
    let sequence = 0;
    const txPayCode = {
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      create: jest.fn(async ({ data }) => {
        const key = `${data.userName}@${data.domain}`.toLowerCase();
        if (reservedNames.has(key)) {
          throw { code: "P2002" };
        }
        reservedNames.add(key);
        sequence += 1;
        return pendingPayCode({
          id: `pay-code-${sequence}`,
          userName: data.userName,
        });
      }),
    };
    const db = {
      payCode: {
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        delete: jest.fn(),
      },
      payCodeParam: { deleteMany: jest.fn() },
      $transaction: jest.fn((operation) => operation({ payCode: txPayCode })),
    };
    mdk.createMdkCheckout.mockResolvedValue({
      id: "checkout-1",
      status: "PENDING_PAYMENT",
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      invoice: null,
    });

    const results = await Promise.allSettled([
      callerFor(db).createPayCode(input("Alice")),
      callerFor(db).createPayCode(input("alice")),
    ]);

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    const rejected = results.find((result) => result.status === "rejected");
    expect(rejected).toMatchObject({
      reason: expect.objectContaining({ code: "CONFLICT" }),
    });
    expect(mdk.createMdkCheckout).toHaveBeenCalledTimes(1);
  });
});

describe("payCode.redeemPayCode", () => {
  it("rejects an unpaid checkout before DNS or activation", async () => {
    const record = pendingPayCode();
    const db = {
      payCode: { findFirst: jest.fn().mockResolvedValue(record) },
      $transaction: jest.fn(),
    };
    mdk.getMdkCheckout.mockResolvedValue({
      id: "checkout-1",
      status: "PENDING_PAYMENT",
      expiresAt: new Date(Date.now() + 60_000),
      invoice: { amountSatsReceived: 0 },
    });

    await expect(
      callerFor(db).redeemPayCode({ payCodeId: record.id })
    ).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    expect(db.$transaction).not.toHaveBeenCalled();
    expect(axios.post).not.toHaveBeenCalled();
  });

  it("activates only the checkout-bound pay code after full payment", async () => {
    const record = pendingPayCode();
    const activeRecord = { ...record, status: "ACTIVE" };
    const txPayCode = {
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      findUniqueOrThrow: jest.fn().mockResolvedValue(activeRecord),
    };
    const db = {
      payCode: { findFirst: jest.fn().mockResolvedValue(record) },
      $transaction: jest.fn((operation) => operation({ payCode: txPayCode })),
    };
    mdk.getMdkCheckout.mockResolvedValue({
      id: "checkout-1",
      status: "PAYMENT_RECEIVED",
      expiresAt: new Date(Date.now() + 60_000),
      invoice: { amountSatsReceived: 5000 },
    });

    await expect(
      callerFor(db).redeemPayCode({ payCodeId: record.id })
    ).resolves.toMatchObject({ id: record.id, status: "ACTIVE" });
    expect(mdk.getMdkCheckout).toHaveBeenCalledWith("checkout-1");
    expect(txPayCode.updateMany).toHaveBeenCalledWith({
      where: { id: record.id, status: "PENDING" },
      data: { status: "ACTIVE", reservationExpiresAt: null },
    });
    expect(axios.post).toHaveBeenCalledTimes(1);
  });

  it("fails closed when MDK returns a different checkout id", async () => {
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const record = pendingPayCode();
    const db = {
      payCode: { findFirst: jest.fn().mockResolvedValue(record) },
      $transaction: jest.fn(),
    };
    mdk.getMdkCheckout.mockResolvedValue({
      id: "checkout-for-someone-else",
      status: "PAYMENT_RECEIVED",
      expiresAt: new Date(Date.now() + 60_000),
      invoice: { amountSatsReceived: 5000 },
    });

    await expect(
      callerFor(db).redeemPayCode({ payCodeId: record.id })
    ).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" });
    expect(db.$transaction).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
