import { ImageResponse } from "next/og";

// Next.js picks up this file automatically and emits <meta property="og:image">
// and the matching twitter:image tags pointing at /opengraph-image, so the
// site gets a link preview in iMessage, Slack, WhatsApp, Telegram, X, etc.

export const alt = "Sotto — Private spend analyser";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "96px",
          background:
            "linear-gradient(135deg, #ffffff 0%, #ecfdf5 55%, #d1fae5 100%)",
          fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
          color: "#18181b",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            marginBottom: "48px",
          }}
        >
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "9999px",
              background: "#10b981",
            }}
          />
          <div
            style={{
              fontSize: "40px",
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: "#18181b",
            }}
          >
            Sotto
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: "96px",
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: "-0.035em",
            color: "#064e3b",
          }}
        >
          <div>Private spend</div>
          <div>analyser.</div>
        </div>
        <div
          style={{
            marginTop: "48px",
            fontSize: "34px",
            fontWeight: 500,
            color: "#047857",
            lineHeight: 1.3,
            maxWidth: "900px",
          }}
        >
          Your bank statement never leaves your browser.
        </div>
      </div>
    ),
    size,
  );
}
