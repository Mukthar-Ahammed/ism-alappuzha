import type { Metadata, Viewport } from "next";
import { Fraunces, Inter, Noto_Naskh_Arabic, Noto_Sans_Malayalam } from "next/font/google";
import "./globals.css";
import { MotionProvider } from "@/components/MotionProvider";
import { getSiteUrl } from "@/lib/site-url";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  axes: ["opsz"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const arabic = Noto_Naskh_Arabic({
  subsets: ["arabic"],
  variable: "--font-arabic",
  display: "swap",
  // Only the Namaz guide and dhikr cards use it, so it is fetched on use, not preloaded.
  preload: false,
  weight: ["400", "500", "600", "700"],
});

const malayalam = Noto_Sans_Malayalam({
  subsets: ["malayalam"],
  variable: "--font-malayalam",
  display: "swap",
  preload: false,
  weight: ["400", "500", "600", "700"],
});

// viewport-fit=cover lets fixed controls use env(safe-area-inset-*) on notched phones.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#FFFFFF",
};

export const metadata: Metadata = {
  title: {
    default: "ISM Alappuzha — Learn. Practise. Serve.",
    template: "%s | ISM Alappuzha",
  },
  description:
    "Islamic Students Movement (ISM) Alappuzha District. Grounding youth in Islamic knowledge, authentic practice, and community service.",
  keywords: [
    "ISM Alappuzha",
    "Islamic Students Movement Alappuzha",
    "ISM Kerala",
    "Islamic Education Kerala",
    "Alappuzha Youth",
    "Namaz Guide Malayalam",
    "Dhikr Library Malayalam",
  ],
  authors: [{ name: "ISM Alappuzha" }],
  creator: "ISM Alappuzha",
  metadataBase: getSiteUrl(),
  icons: {
    icon: "/images/logo/ism-icon-192.png",
    shortcut: "/images/logo/ism-icon-192.png",
    apple: "/images/logo/ism-apple-icon-180.png",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "/",
    title: "ISM Alappuzha — Learn. Practise. Serve.",
    description:
      "Official portal of Islamic Students Movement (ISM) Alappuzha District Committee.",
    siteName: "ISM Alappuzha",
    images: [
      {
        url: "/images/logo/ism-logo-800.png",
        width: 800,
        height: 800,
        alt: "ISM Alappuzha Logo",
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable} ${arabic.variable} ${malayalam.variable} h-full antialiased scroll-smooth`}
    >
      <body className="min-h-full bg-bg text-text-main font-body selection:bg-secondary/30 selection:text-primary flex flex-col">
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
