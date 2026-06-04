import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "TwelveCash user profile";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

const DEFAULT_DOMAIN = "twelve.cash";

function parseUserParam(userParam: string) {
  const decoded = decodeURIComponent(userParam);
  const [user, domain = DEFAULT_DOMAIN] = decoded.split("@");
  return { user, domain };
}

export default async function Image({
  params,
}: {
  params: Promise<{ user: string }>;
}) {
  const { user: userParam } = await params;
  const { user, domain } = parseUserParam(userParam);
  const displayName = `${user}@${domain}`;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background:
            "linear-gradient(135deg, #120428 0%, #4c1d95 55%, #8cf506 140%)",
          color: "white",
          padding: "56px 64px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 34,
            opacity: 0.95,
          }}
        >
          <div>TwelveCash</div>
          <div style={{ color: "#8cf506" }}>Simple Bitcoin Usernames</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              display: "flex",
              fontSize: 28,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: "#d8b4fe",
            }}
          >
            Pay me in bitcoin
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              fontSize: 88,
              fontWeight: 700,
              lineHeight: 1.05,
              maxWidth: "100%",
            }}
          >
            {displayName}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              fontSize: 30,
            }}
          >
            <div style={{ color: "#e9d5ff" }}>BOLT 12 offers • Silent payments • more</div>
            <div style={{ opacity: 0.8, fontSize: 24 }}>twelve.cash</div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 112,
              height: 112,
              borderRadius: 9999,
              backgroundColor: "#8cf506",
              color: "#120428",
              fontSize: 60,
              fontWeight: 700,
            }}
          >
            ₿
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
