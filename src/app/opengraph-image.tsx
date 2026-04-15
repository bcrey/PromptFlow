import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "PromptFlow — Organize and manage your prompts";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #faf9f7 0%, #f0eeea 100%)",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 96,
            height: 96,
            borderRadius: 24,
            background: "#1e8e3e",
            marginBottom: 40,
          }}
        >
          <svg
            width="44"
            height="44"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="4 17 10 11 4 5" />
            <line x1="12" y1="19" x2="20" y2="19" />
          </svg>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            color: "#1a1a1a",
            letterSpacing: "-0.02em",
            marginBottom: 16,
          }}
        >
          PromptFlow
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 24,
            color: "#6b6560",
            fontWeight: 400,
          }}
        >
          Organize and manage your prompts like a pro
        </div>
      </div>
    ),
    { ...size }
  );
}
