import type { Metadata } from "next";
import { Inter } from "next/font/google";
import ServiceWorkerRegistration from "../components/ServiceWorkerRegistration";
import { Providers } from "./providers";
import "../styles/global.scss";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Taskero - Task Management",
  description: "All in one platform to get tasks done",
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
      </body>
    </html>
  );
}
