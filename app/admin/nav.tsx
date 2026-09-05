import { LayoutDashboardIcon, PackageIcon, ReceiptIcon, ScrollTextIcon } from 'lucide-react';

import type { NavSection } from '@/components/shell/nav-links';

export const adminNav: NavSection[] = [
  {
    title: 'Platform admin',
    items: [
      { href: '/admin/products', label: 'Termékek és csomagok', icon: <PackageIcon /> },
      { href: '/admin/orders', label: 'Rendelések és kulcsok', icon: <ReceiptIcon /> },
      { href: '/admin/audit', label: 'Audit napló', icon: <ScrollTextIcon /> },
    ],
  },
  {
    title: 'Saját fiók',
    items: [{ href: '/dashboard', label: 'Vezérlőpult', icon: <LayoutDashboardIcon /> }],
  },
];
