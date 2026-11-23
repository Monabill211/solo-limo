import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import SiteShell from "./components/layout/SiteShell";
import { CurrencyProvider } from "./providers/CurrencyProvider";

export const instant = false;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Solo Limo",
  description: "Premium limousine services",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <CurrencyProvider>
            <SiteShell header={<Header />} footer={<Footer />}>
              {children}
            </SiteShell>
          </CurrencyProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}