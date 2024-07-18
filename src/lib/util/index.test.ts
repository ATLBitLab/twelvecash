const { lnaddrToLNURL, createBip21 } = require("./index");

test("try using different lightning address inputs", () => {
  expect(lnaddrToLNURL("chad@strike.me")).toBe(
    "lnurl1dp68gurn8ghj7um5wf5kkefwd4jj7tnhv4kxctttdehhwm30d3h82unvwqhkx6rpvsclqksp"
  );
  expect(() => lnaddrToLNURL("")).toThrow();
  expect(() => lnaddrToLNURL("test")).toThrow();
  expect(() => lnaddrToLNURL("@domain.com")).toThrow();
});

const onChain = "175tWpb8K1S7NmH4Zx6rewF9WQrcZv245W";
const label = "Luke-Jr"; // make sure no spaces
const lno =
  "lno1qsgqmqvgm96frzdg8m0gc6nzeqffvzsqzrxqy32afmr3jn9ggkwg3egfwch2hy0l6jut6vfd8vpsc3h89l6u3dm4q2d6nuamav3w27xvdmv3lpgklhg7l5teypqz9l53hj7zvuaenh34xqsz2sa967yzqkylfu9xtcd5ymcmfp32h083e805y7jfd236w9afhavqqvl8uyma7x77yun4ehe9pnhu2gekjguexmxpqjcr2j822xr7q34p078gzslf9wpwz5y57alxu99s0z2ql0kfqvwhzycqq45ehh58xnfpuek80hw6spvwrvttjrrq9pphh0dpydh06qqspp5uq4gpyt6n9mwexde44qv7lstzzq60nr40ff38u27un6y53aypmx0p4qruk2tf9mjwqlhxak4znvna5y";
const sp =
  "sp1qqweplq6ylpfrzuq6hfznzmv28djsraupudz0s0dclyt8erh70pgwxqkz2ydatksrdzf770umsntsmcjp4kcz7jqu03jeszh0gdmpjzmrf5u4zh0c";
const custom1 = {
  prefix: "lnurl",
  value:
    "lnurl1dp68gurn8ghj7um5wf5kkefwd4jj7tnhv4kxctttdehhwm30d3h82unvwqhkx6rpvsclqksp",
};
const custom2 = {
  prefix: "chad",
  value: "test",
};
const testCases = [
  { input: {}, expected: "No payment option provided", shouldThrow: true },
  { input: { onChain }, expected: `bitcoin:${onChain}`, shouldThrow: false },
  {
    input: { onChain, label },
    expected: `bitcoin:${onChain}?label=${label}`,
    shouldThrow: false,
  },
  {
    input: { label },
    expected: "No payment option provided",
    shouldThrow: true,
  },
  {
    input: { onChain, label, lno },
    expected: `bitcoin:${onChain}?label=${label}&lno=${lno}`,
    shouldThrow: false,
  },
  {
    input: { onChain, lno },
    expected: `bitcoin:${onChain}?lno=${lno}`,
    shouldThrow: false,
  },
  { input: { lno }, expected: `bitcoin:?lno=${lno}`, shouldThrow: false },
  {
    input: { lno, label },
    expected: `bitcoin:?lno=${lno}`,
    shouldThrow: false,
  },
  {
    input: { sp, custom: [custom1] },
    expected: `bitcoin:?sp=${sp}&${custom1.prefix}=${custom1.value}`,
    shouldThrow: false,
  },
  {
    input: { custom: [custom2, custom1] },
    expected: `bitcoin:?${custom2.prefix}=${custom2.value}&${custom1.prefix}=${custom1.value}`,
    shouldThrow: false,
  },
  {
    input: { custom: [] },
    expected: "No payment option provided",
    shouldThrow: true,
  },
  {
    input: { sp, custom: [] },
    expected: `bitcoin:?sp=${sp}`,
    shouldThrow: false,
  },
  {
    input: { sp: "z".repeat(2036) }, // "bitcoin:?sp=" is 12 chars, total 2048
    expected: `bitcoin:?sp=${"z".repeat(2036)}`,
    shouldThrow: false,
  },
  {
    input: { sp: "z".repeat(2037) }, // total 2049
    expected: "Bip21 URI is greater than 2048 characters",
    shouldThrow: true,
  },
  {
    input: {
      lno: "lno123...xyz",
      sp: "sp123...xyz",
      onChain: "bc1p...xyz",
      custom: [
        { prefix: "lnurl", value: "lnur123...xyz" },
        { prefix: "veggie", value: "carrot" },
      ],
    },
    expected: `bitcoin:bc1p...xyz?lno=lno123...xyz&sp=sp123...xyz&lnurl=lnur123...xyz&veggie=carrot`,
    shouldThrow: false,
  },
];
test.each(testCases)(
  "createBip21($input) should return $expected",
  ({ input, expected, shouldThrow }) => {
    if (shouldThrow) {
      expect(() => createBip21(input)).toThrow(expected);
    } else {
      expect(createBip21(input)).toBe(expected);
    }
  }
);
