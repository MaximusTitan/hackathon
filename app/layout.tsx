import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import HeaderNav from "@/components/header-nav"; // Add this import

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
    <html lang="en" className={geistSans.className} suppressHydrationWarning>
      <body style={{ backgroundColor: "#F7F1EF", color: "#333" }}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {/* Header Navigation */}
          <HeaderNav />
          <main className="min-h-screen flex items-center justify-center p-4">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
