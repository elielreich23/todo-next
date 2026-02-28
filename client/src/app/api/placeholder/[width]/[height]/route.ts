import type { NextRequest } from "next/server";

// Simple dynamic SVG placeholder generator for avatars/thumbnails
// URL format: /api/placeholder/{width}/{height}?seed=123

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: { width: string; height: string } }
) {
  const { width: widthParam, height: heightParam } = context.params;

  const width = Number.parseInt(widthParam, 10) || 40;
  const height = Number.parseInt(heightParam, 10) || 40;

  // Optional seed can be used in future to vary colors
  const seed = request.nextUrl.searchParams.get("seed") ?? "";

  const bgColor = "#e5e7eb"; // Tailwind zinc-200
  const borderColor = "#d1d5db"; // Tailwind gray-300
  const textColor = "#9ca3af"; // Tailwind gray-400
  const fontSize = Math.round(Math.min(width, height) * 0.35);

  const initials =
    seed && seed.length >= 2
      ? seed
          .toString()
          .slice(0, 2)
          .toUpperCase()
      : "TN";

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Placeholder avatar">
  <defs>
    <linearGradient id="grad" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="${bgColor}" />
      <stop offset="100%" stop-color="${borderColor}" />
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" rx="${Math.round(
    width / 2
  )}" fill="url(#grad)" />
  <circle cx="${width / 2}" cy="${height / 2}" r="${
    Math.round(Math.min(width, height) / 2) - 1
  }" fill="none" stroke="${borderColor}" stroke-width="2" />
  <text
    x="50%"
    y="50%"
    fill="${textColor}"
    font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    font-size="${fontSize}"
    font-weight="600"
    dominant-baseline="middle"
    text-anchor="middle"
  >
    ${initials}
  </text>
</svg>
`.trim();

  return new Response(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
}
