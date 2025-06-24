import type { Metadata } from "next";
import { cn } from "@/lib/utils";
import "@/styles/globals.css";
import { sans, mono } from "@/styles/fonts";

export const metadata: Metadata = {
  title: "Race Monaco",
  description: "",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={cn(
          sans.className,
          mono.className,
          "relative w-full h-screen antialiased subpixel-antialiased",
        )}
      >
        {children}
      </body>
    </html>
  );
}
