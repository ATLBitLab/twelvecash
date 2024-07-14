const lnaddrToLNURL = require("./index").lnaddrToLNURL;

test("try using different lightning address inputs", () => {
  expect(lnaddrToLNURL("chad@strike.me")).toBe(
    "lnurl1dp68gurn8ghj7um5wf5kkefwd4jj7tnhv4kxctttdehhwm30d3h82unvwqhkx6rpvsclqksp"
  );
  expect(() => lnaddrToLNURL("")).toThrow();
  expect(() => lnaddrToLNURL("test")).toThrow();
  expect(() => lnaddrToLNURL("@domain.com")).toThrow();
});
