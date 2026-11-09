import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import "./globals.css";

const title = "英句練習｜互動式英文句子學習";
const description =
  "以繁體中文提示，逐步練習英文單字、語塊、句子重組、句意辨識與句型換字。";
const socialImage = {
  url: "/og.jpg",
  width: 1200,
  height: 628,
  alt: "英句練習－一句一句，真的記住",
};

// Social previews need an absolute origin. Prefer the configured deployment
// origin. Otherwise use the routed Host header only: X-Forwarded-Host and
// X-Forwarded-Proto are client-controlled and must not choose preview URLs.
const resolveSiteUrl = async () => {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) {
    try {
      return new URL(configured);
    } catch {
      // Fall through to the request host when the setting is malformed.
    }
  }
  const host = (await headers()).get("host") ?? "localhost:3000";
  const isLocal = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i.test(host);
  try {
    return new URL(`${isLocal ? "http" : "https"}://${host}`);
  } catch {
    return new URL("http://localhost:3000");
  }
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    metadataBase: await resolveSiteUrl(),
    title,
    description,
    icons: { icon: { url: "/favicon.svg", type: "image/svg+xml" } },
    openGraph: {
      title,
      description,
      type: "website",
      locale: "zh_TW",
      images: [socialImage],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [socialImage.url],
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#f7f4ef",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
