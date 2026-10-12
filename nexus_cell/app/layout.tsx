import type { Metadata, Viewport } from "next";
import { Oswald, Source_Sans_3 } from "next/font/google";
import { BRAND } from "@/lib/brand";
import { ToastProvider } from "@/components/shared/Toast";
import "./globals.css";

// Two faces only: Oswald labels things (display), Source Sans 3 is for reading.
const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});
const oswald = Oswald({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: BRAND.fullName,
    template: `%s · ${BRAND.name}`,
  },
  description: `${BRAND.fullName} — ${BRAND.tagline}`,
  icons: { icon: BRAND.mark },
};

export const viewport: Viewport = {
  themeColor: "#0A0B0C",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${sourceSans.variable} ${oswald.variable}`}>
      <body className="bg-rp-bg text-rp-text font-sans antialiased">
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
