import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import CustomHeadImports from "./head";
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
  title: "15MinuteCity",
  description: "Visualization of the 15-minute city index in Spain using API-IDEE and Next.js. Explore accessibility to essential services within a 15-minute walk or bike ride from your location.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head><CustomHeadImports /></head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
