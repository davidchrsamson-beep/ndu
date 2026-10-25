import type { NextConfig } from "next";

// Extra instructions sent with every page, telling the browser to be stricter.
const securityHeaders = [
  // Don't guess a file's type; a "photo" can't secretly run as a script.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // No other website may show Ndu pages inside a hidden frame (stops click-tricking).
  { key: "X-Frame-Options", value: "DENY" },
  // When a buyer leaves for WhatsApp, other sites only learn "came from Ndu", not the full page address.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Pages can't silently ask for camera, microphone or location.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // Always use the secure https:// version of the site.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  // Don't advertise which framework we use; that helps attackers pick tools.
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;