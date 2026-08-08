import { isCheckoutPaid } from "@/server/mdk";

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
