import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { UserProvider } from "../contexts/UserContext";
import { ProjectsProvider } from "../contexts/ProjectsContext";
import ServiceWorkerRegistration from "../components/ServiceWorkerRegistration";

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
        <UserProvider>
          <ProjectsProvider>
            {children}
            <ServiceWorkerRegistration />
          </ProjectsProvider>
        </UserProvider>
      </body>
    </html>
  );
}
