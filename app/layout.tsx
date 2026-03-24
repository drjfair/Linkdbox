import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "./components/Sidebar";
import { getAccounts } from "@/lib/accounts";
import { getAccountEmail } from "@/lib/gmail";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LinkBox",
  description: "AI-powered inbox — labels applied, drafts ready",
};

async function getPrimaryAccount() {
  try {
    const accounts = getAccounts();
    if (accounts.length === 0) return undefined;
    const primary = accounts[0];
    const email = await getAccountEmail(primary);
    return { ...primary, email };
  } catch {
    return undefined;
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const primaryAccount = await getPrimaryAccount();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-gray-50 flex">
        <Sidebar primaryAccount={primaryAccount} />
        <div className="flex-1 ml-60 min-h-screen flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
