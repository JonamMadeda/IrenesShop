import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppShell from "./components/AppShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "IRENE'S-SHOP",
  description: "Retail and Shop Management Application",
};

import { ShopProvider } from "./context/ShopContext";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-white text-blue-900 antialiased`}
      >
        <ShopProvider>
          <AppShell>{children}</AppShell>
        </ShopProvider>
      </body>
    </html>
  );
}
