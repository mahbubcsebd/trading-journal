import { ImageResponse } from "next/og";

const ALLOWED_SIZES = [180, 192, 512];
const DEFAULT_SIZE = 512;

/** App icon rendered as PNG. ?size=192|512|180  &maskable=1 adds safe-zone padding. */
export function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const requested = Number(params.get("size"));
  const size = ALLOWED_SIZES.includes(requested) ? requested : DEFAULT_SIZE;
  const maskable = params.get("maskable") === "1";

  // Maskable icons keep the mark inside the central 80% and fill the whole square.
  const mark = Math.round(size * (maskable ? 0.46 : 0.56));
  const radius = maskable ? 0 : Math.round(size * 0.22);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #8b6cf0 0%, #6b46d6 100%)",
        borderRadius: radius,
      }}
    >
      <svg
        width={mark}
        height={mark}
        viewBox="0 0 24 24"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 3v16a2 2 0 0 0 2 2h16" />
        <path d="m19 9-5 5-4-4-3 3" />
      </svg>
    </div>,
    {
      width: size,
      height: size,
      headers: { "Cache-Control": "public, max-age=31536000, immutable" },
    },
  );
}
