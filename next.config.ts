import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV === "development";
const supabaseImagesHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : null;
const adminScriptSrc = isDevelopment
  ? "'self' 'unsafe-inline' 'unsafe-eval'"
  : "'self' 'unsafe-inline'";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // The admin home (dashboard) lives at /admin; /admin/dashboard is an alias for it.
      { source: "/admin/dashboard", destination: "/admin", permanent: false },
    ];
  },
  async headers() {
    const publicSecurityHeaders = [
      {
        key: "X-Content-Type-Options",
        value: "nosniff",
      },
      {
        key: "Referrer-Policy",
        value: "strict-origin-when-cross-origin",
      },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=()",
      },
      {
        // Other sites may not frame these pages (clickjacking). The admin adds frame-ancestors 'none'.
        key: "X-Frame-Options",
        value: "SAMEORIGIN",
      },
      ...(isDevelopment
        ? []
        : [
            {
              key: "Strict-Transport-Security",
              value: "max-age=63072000; includeSubDomains; preload",
            },
          ]),
    ];

    // Public files are not fingerprinted, so they are cached for a day and then
    // revalidated in the background instead of being cached forever.
    const publicAssetCache = {
      key: "Cache-Control",
      value: "public, max-age=86400, stale-while-revalidate=604800",
    };

    return [
      {
        source: "/:path*",
        headers: publicSecurityHeaders,
      },
      {
        source: "/models/:path*",
        headers: [publicAssetCache],
      },
      {
        source: "/images/:path*",
        headers: [publicAssetCache],
      },
      {
        source: "/admin/:path*",
        headers: [
          ...publicSecurityHeaders,
          {
            key: "Content-Security-Policy",
            value: `default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'; img-src 'self' data: blob:; script-src ${adminScriptSrc}; style-src 'self' 'unsafe-inline'; connect-src 'self' https://*.supabase.co; font-src 'self' data:; frame-src https://www.youtube-nocookie.com https://www.facebook.com${supabaseImagesHost ? ` https://${supabaseImagesHost}` : ""}`,
          },
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow, noarchive",
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "img.youtube.com",
      },
      {
        protocol: "https",
        hostname: "i.ytimg.com",
      },
      {
        protocol: "https",
        hostname: "cdn.ism.org.in",
      },
      ...(supabaseImagesHost
        ? [
            {
              protocol: "https" as const,
              hostname: supabaseImagesHost,
              pathname: "/storage/v1/object/public/site-images/**",
            },
          ]
        : []),
    ],
    formats: ["image/avif", "image/webp"],
  },
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;
