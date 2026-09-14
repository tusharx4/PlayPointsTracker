import type { Metadata, Viewport } from "next";
import { Google_Sans, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const googleSans = Google_Sans({
  subsets: ["latin"],
  variable: "--font-gs",
  display: "swap",
  weight: "variable",
  axes: ["opsz"],
});

export const metadata: Metadata = {
  title: "Play Points Tracker",
  description:
    "Track Google Play Points across multiple Gmail accounts — weekly claims, quest rewards, purchase bonuses and redemptions in one dashboard.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/apple-touch-180.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Play Points",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#121212" },
    { media: "(prefers-color-scheme: light)", color: "#f6f8fc" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${googleSans.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem("playpoints.theme")==="dark"){document.documentElement.classList.add("dark");}}catch(e){}`,
          }}
        />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
