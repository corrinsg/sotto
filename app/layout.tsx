import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // Absolute base for og:image URLs so scrapers on iMessage / Slack /
  // WhatsApp / Telegram / X get a full URL they can actually fetch.
  metadataBase: new URL("https://usesotto.vercel.app"),
  title: "Sotto — Private spend analyser",
  description:
    "Analyse your spending without uploading anything. Your statement never leaves your browser.",
  openGraph: {
    title: "Sotto — Private spend analyser",
    description:
      "Analyse your spending without uploading anything. Your statement never leaves your browser.",
    url: "https://usesotto.vercel.app",
    siteName: "Sotto",
    type: "website",
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sotto — Private spend analyser",
    description:
      "Analyse your spending without uploading anything. Your statement never leaves your browser.",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Reading headers() forces dynamic rendering so Next.js re-runs SSR
  // per request. This lets the framework pick up the x-nonce header set
  // by proxy.ts and attach it to every inline hydration script.
  await headers();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="relative min-h-full flex flex-col bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        {children}
      </body>
    </html>
  );
}
