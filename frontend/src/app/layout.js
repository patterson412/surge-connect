import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import StoreProvider from "../providers/StoreProvider";
import { ThemeProvider } from "@/providers/theme-provider";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "SurgeConnect",
  description: "Created by Patterson Leon",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased dark:bg-black`}
      >
        <StoreProvider>
          <ThemeProvider>
            {children}
            <Toaster />
          </ThemeProvider>
        </StoreProvider>
      </body>
    </html>
  );
}

