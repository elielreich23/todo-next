import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import ServiceWorkerRegistration from "../components/ServiceWorkerRegistration";
import { Providers } from "./providers";
import "../styles/global.scss";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Tasker — Collaborative task & project management",
  description:
    "Real-time collaboration for tasks and projects. Built for startups and student teams who need simple, intuitive teamwork.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {children}
          <ServiceWorkerRegistration />
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
