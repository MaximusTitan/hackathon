import { Geist } from "next/font/google";
import "./globals.css";
import HeaderNav from "@/components/header-nav";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/providers/auth-provider";
import AuthRefreshHandler from "@/components/AuthRefreshHandler";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Hackon",
  description: "Discover and join amazing events.",
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
        <AuthProvider>
          <AuthRefreshHandler />
          <HeaderNav />
          <main className="min-h-screen flex items-start justify-center">
            {children}
          </main>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
