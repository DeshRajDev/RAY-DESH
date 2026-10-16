import React from 'react';
import { AppShell } from '@/components/layout/app-shell';

export const instant = false;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
