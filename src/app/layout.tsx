import type { Metadata } from "next";
import { Urbanist } from "next/font/google";
import "./globals.css";

import { TRPCReactProvider } from "@/trpc/react";
import UserProvider from "./components/UserProvider";
import Header from "./components/Header";

const urbanist = Urbanist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Twelve Cash",
  description: "Simple Bitcoin User Name",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="p-0 m-0">
      <body className={urbanist.className + " p-0 m-0"}>
        <TRPCReactProvider>
          <UserProvider>
            <div className="text-purple-800 bg-12teal bg-gradient-to-b from-purple-800/20 from-0% to-purple-800/0 to-50% h-full">
              <Header />
              <div className="min-h-full p-4">{children}</div>
              <footer className="border-t border-t-purple-800 pt-2 mt-4 text-purple-800">
                <ul className="flex flex-col gap-2 md:flex-row md:gap-4 md: p-4 items-center justify-center">
                  <li>
                    <a href="https://github.com/ATLBitLab/twelvecash">
                      Developer Docs
                    </a>
                  </li>
                  <li>
                    Made with 🧡 at{" "}
                    <a href="https://atlbitlab.com/">ATL BitLab</a>
                  </li>
                </ul>
              </footer>
            </div>
          </UserProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
