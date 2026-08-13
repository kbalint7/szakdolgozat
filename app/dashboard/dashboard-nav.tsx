'use client';

import { LayoutDashboardIcon, ShieldIcon } from 'lucide-react';

import { NavLinks, type NavSection } from '@/components/shell/nav-links';

export function DashboardNav({ isPlatformAdmin }: { isPlatformAdmin: boolean }) {
  const sections: NavSection[] = [
    {
      title: 'Személyes',
      items: [{ href: '/dashboard', label: 'Áttekintés', icon: <LayoutDashboardIcon />, exact: true }],
    },
  ];

  if (isPlatformAdmin) {
    sections.push({
      title: 'Platform',
      items: [{ href: '/admin', label: 'Platform admin', icon: <ShieldIcon /> }],
    });
  }

  return <NavLinks sections={sections} />;
}
