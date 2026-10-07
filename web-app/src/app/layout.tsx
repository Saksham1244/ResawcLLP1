import type { Metadata } from "next";
import { ThemeProvider } from "./ThemeProvider";
import { RoleProvider } from "@/context/RoleContext";
import { SmoothScrollProvider } from "@/components/SmoothScrollProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Resawc CRM - Post-Production Management",
  description: "Comprehensive CRM and Project Management for Resawc Editing Team",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <RoleProvider>
            <SmoothScrollProvider>
              {children}
            </SmoothScrollProvider>
          </RoleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
