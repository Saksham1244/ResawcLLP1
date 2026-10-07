import type { Metadata } from "next";
import { ThemeProvider } from "./ThemeProvider";
import { RoleProvider } from "@/context/RoleContext";
import { SmoothScrollProvider } from "@/components/SmoothScrollProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Resawc CRM - Post-Production Management",
  description: "Comprehensive CRM and Project Management for Resawc Editing Team",
  other: {
    "color-scheme": "light",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light" data-theme="light" style={{ colorScheme: "light" }} suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light" />
      </head>
      <body style={{ colorScheme: "light" }}>
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
