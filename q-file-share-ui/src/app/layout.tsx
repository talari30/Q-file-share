import "./globals.css";

import React from "react";

import type { Metadata } from "next";
import { NotificationProvider } from "@/context";

export const metadata: Metadata = {
  title: "QFileShare",
  description: "Developed using Next.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;700&family=Poppins:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <NotificationProvider>{children}</NotificationProvider>
      </body>
    </html>
  );
}
