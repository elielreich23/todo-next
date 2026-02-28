"use client";

import React from "react";
import { UserProvider } from "../contexts/UserContext";
import { ProjectsProvider } from "../contexts/ProjectsContext";

type ProvidersProps = {
  children: React.ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  return (
    <UserProvider>
      <ProjectsProvider>{children}</ProjectsProvider>
    </UserProvider>
  );
}
