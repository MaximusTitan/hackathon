import { Geist } from "next/font/google";
import "./globals.css";
import HeaderNav from "@/components/header-nav";
import { Toaster } from "@/components/ui/sonner";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Hackathon App",
  description: "Simple authentication app",
};

const geistSans = Geist({
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.className} light`}>
      <body style={{ backgroundColor: "#F7F1EF", color: "#333" }}>
        <HeaderNav />
        <main className="min-h-screen flex items-start justify-center">
          {children}
        </main>
        <Toaster />
      </body>
    </html>
  );
}
