import type { Metadata } from "next";
import { ThemeProvider } from "./ThemeProvider";
import { RoleProvider } from "@/context/RoleContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "CRM & Team Management",
  description: "Comprehensive CRM and Project Management for our Editing Team",
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
            {children}
          </RoleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
