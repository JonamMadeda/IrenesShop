"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";

const PUBLIC_ROUTES = new Set(["/", "/auth"]);

export default function AppShell({ children }) {
  const pathname = usePathname();
  const isPublicRoute = PUBLIC_ROUTES.has(pathname);

  return (
    <>
      {!isPublicRoute && <Navbar />}
      <main
        className={
          isPublicRoute
            ? "min-h-screen"
            : "min-h-screen pt-16 transition-all md:pl-64 md:pt-0"
        }
      >
        <div className="min-h-screen">{children}</div>
      </main>
    </>
  );
}
