import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Gold Moment Tattoo Bali",
  description: "Book your tattoo with Gold Moment Tattoo Bali",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <Analytics />
      <body className={`${geist.className} antialiased`}>{children}</body>
    </html>
  );
}
