import type { Metadata } from "next";
import { Fraunces, Inter, Noto_Naskh_Arabic, Noto_Sans_Malayalam } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  axes: ["SOFT", "WONK", "opsz"],
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
  weight: ["400", "500", "600", "700"],
});

const malayalam = Noto_Sans_Malayalam({
  subsets: ["malayalam"],
  variable: "--font-malayalam",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

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
  metadataBase: new URL("https://ismalappuzha.org"),
  icons: {
    icon: "/images/logo/ism-logo.png",
    shortcut: "/images/logo/ism-logo.png",
    apple: "/images/logo/ism-logo.png",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://ismalappuzha.org",
    title: "ISM Alappuzha — Learn. Practise. Serve.",
    description:
      "Official portal of Islamic Students Movement (ISM) Alappuzha District Committee.",
    siteName: "ISM Alappuzha",
    images: [
      {
        url: "/images/logo/ism-logo.png",
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
        {children}
      </body>
    </html>
  );
}
