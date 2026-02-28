import "./globals.css";

export const metadata = {
  title: "PickYouUP 機場接送 | 有溫度的專業接送服務",
  description: "PickYouUP 提供全台灣機場接送服務，準時、安全、舒適。對標國際級奢華水準，為您打造尊榮的移動體驗。立即預約！",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-Hant">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
