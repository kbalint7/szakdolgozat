'use client';

import { LayoutDashboardIcon } from 'lucide-react';

import { NavLinks, type NavSection } from '@/components/shell/nav-links';

export function DashboardNav() {
  const sections: NavSection[] = [
    {
      title: 'Személyes',
      items: [{ href: '/dashboard', label: 'Áttekintés', icon: <LayoutDashboardIcon />, exact: true }],
    },
  ];

  return <NavLinks sections={sections} />;
}
