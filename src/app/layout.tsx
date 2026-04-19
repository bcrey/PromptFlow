import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/components/AuthProvider";
import "./globals.css";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PromptFlow",
  description: "Organize and manage your prompts like a pro",
  openGraph: {
    title: "PromptFlow",
    description: "Organize and manage your prompts like a pro",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PromptFlow",
    description: "Organize and manage your prompts like a pro",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="h-full overflow-hidden">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
