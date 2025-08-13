"use client";

import React from 'react';
import Dashboard from './dashboard';

export default function DashboardLayout({ children }) {
  return (
    <Dashboard>
      {children}
    </Dashboard>
  );
}
  