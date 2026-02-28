// 全域 Layout

import type { Metadata } from "next";
import { Inter, Noto_Sans_TC } from "next/font/google";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter'
});

const notoSansTC = Noto_Sans_TC({
  subsets: ["latin"],
  weight: ['400', '500', '600', '700'],
  variable: '--font-noto-tc'
});

export const metadata: Metadata = {
  title: "GMO — Give Me Order | 派單平台",
  description: "GMO 專業機場接送派單平台 by PickYouUP",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body className={`${inter.variable} ${notoSansTC.variable} font-sans`}>
        {children}
      </body>
    </html>
  );
}
