import { Geist, Geist_Mono } from "next/font/google";

const mono = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const sans = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export { sans, mono };
