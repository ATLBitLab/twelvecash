import { isCheckoutPaid, isCheckoutTerminallyUnpaid } from "@/server/mdk";

const REQUIRED = 5000;

describe("isCheckoutPaid", () => {
  it("accepts a fully-paid checkout", () => {
    expect(
      isCheckoutPaid(
        { status: "PAYMENT_RECEIVED", invoice: { amountSatsReceived: 5000 } },
        REQUIRED
      )
    ).toBe(true);
  });

  it("accepts an overpayment", () => {
    expect(
      isCheckoutPaid(
        { status: "PAYMENT_RECEIVED", invoice: { amountSatsReceived: 5001 } },
        REQUIRED
      )
    ).toBe(true);
  });

  // The received amount is authoritative, not the status. MDK's own client hook
  // treats a settled invoice as payment regardless of status lag, and both
  // redemption and the stale-reservation sweep rely on that: narrowing this to a
  // status-only check would strand — and then resell the name of — a buyer whose
  // sats have already landed.
  it("accepts full payment even while the status still lags at PENDING_PAYMENT", () => {
    expect(
      isCheckoutPaid(
        { status: "PENDING_PAYMENT", invoice: { amountSatsReceived: 5000 } },
        REQUIRED
      )
    ).toBe(true);
  });

  it("rejects a partial payment while the status lags at PENDING_PAYMENT", () => {
    expect(
      isCheckoutPaid(
        { status: "PENDING_PAYMENT", invoice: { amountSatsReceived: 4999 } },
        REQUIRED
      )
    ).toBe(false);
  });

  it("rejects an underpayment even when status says received", () => {
    expect(
      isCheckoutPaid(
        { status: "PAYMENT_RECEIVED", invoice: { amountSatsReceived: 4999 } },
        REQUIRED
      )
    ).toBe(false);
  });

  it("rejects a pending checkout with no invoice", () => {
    expect(
      isCheckoutPaid({ status: "PENDING_PAYMENT", invoice: null }, REQUIRED)
    ).toBe(false);
  });

  it("rejects when status is received but the amount is unprovable (fail closed)", () => {
    expect(
      isCheckoutPaid({ status: "PAYMENT_RECEIVED", invoice: null }, REQUIRED)
    ).toBe(false);
  });

  it("rejects an expired checkout with zero received", () => {
    expect(
      isCheckoutPaid(
        { status: "EXPIRED", invoice: { amountSatsReceived: 0 } },
        REQUIRED
      )
    ).toBe(false);
  });

  it("rejects when amountSatsReceived is undefined", () => {
    expect(
      isCheckoutPaid(
        { status: "PAYMENT_RECEIVED", invoice: { amountSatsReceived: undefined } },
        REQUIRED
      )
    ).toBe(false);
  });
});

describe("isCheckoutTerminallyUnpaid", () => {
  // Only MDK's terminal EXPIRED status may release a name reservation. Every
  // other unpaid state is a checkout whose invoice can still settle.
  it.each([
    ["UNCONFIRMED"],
    ["CONFIRMED"],
    ["PENDING_PAYMENT"],
  ])("treats an unpaid %s checkout as still live", (status) => {
    expect(
      isCheckoutTerminallyUnpaid(
        { status, invoice: { amountSatsReceived: 0 } },
        REQUIRED
      )
    ).toBe(false);
  });

  it("treats an expired checkout with nothing received as terminally unpaid", () => {
    expect(
      isCheckoutTerminallyUnpaid(
        { status: "EXPIRED", invoice: { amountSatsReceived: 0 } },
        REQUIRED
      )
    ).toBe(true);
  });

  it("does not call an expired checkout unpaid once it has been paid in full", () => {
    expect(
      isCheckoutTerminallyUnpaid(
        { status: "EXPIRED", invoice: { amountSatsReceived: 5000 } },
        REQUIRED
      )
    ).toBe(false);
  });

  it("treats an expired, underpaid checkout as terminally unpaid", () => {
    expect(
      isCheckoutTerminallyUnpaid(
        { status: "EXPIRED", invoice: { amountSatsReceived: 4999 } },
        REQUIRED
      )
    ).toBe(true);
  });

  it("treats an expired checkout with no invoice as terminally unpaid", () => {
    expect(
      isCheckoutTerminallyUnpaid({ status: "EXPIRED", invoice: null }, REQUIRED)
    ).toBe(true);
  });

  it("never reports a paid checkout as terminally unpaid", () => {
    expect(
      isCheckoutTerminallyUnpaid(
        { status: "PAYMENT_RECEIVED", invoice: { amountSatsReceived: 5000 } },
        REQUIRED
      )
    ).toBe(false);
  });
});
