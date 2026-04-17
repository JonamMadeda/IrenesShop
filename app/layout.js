import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "IRENESSHOP",
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
          <Navbar />
          <main className="min-h-screen pt-16 transition-all md:pl-64 md:pt-0">
            <div className="min-h-screen">{children}</div>
          </main>
        </ShopProvider>
      </body>
    </html>
  );
}
