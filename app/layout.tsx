import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { ToastProvider } from "@/components/ui/Toast";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "OJT Connect PH — Free Internship Portal for the Philippines",
  description: "Connect Filipino students with internship opportunities. Find OJT positions, verify students, and manage connections — all for free.",
   icons: {
    icon: '/Logo/favicon.png',
    shortcut: '/Logo/favicon.png',
    apple: '/Logo/favicon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: `window.__hanarad_config={site_id:"ojtcon.work24ph.com",api_base:"https://hanawidget.little-poetry-975f.workers.dev"};` }} />
        <script src="https://hanawidget.little-poetry-975f.workers.dev/loader.js" data-site-id="ojtcon.work24ph.com" data-api-base="https://hanawidget.little-poetry-975f.workers.dev" async />
      </head>
      <body className={`${inter.variable} antialiased`}>
        <SessionProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
