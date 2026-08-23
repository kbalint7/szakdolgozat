import { LayoutDashboardIcon, PackageIcon, ReceiptIcon } from 'lucide-react';

import type { NavSection } from '@/components/shell/nav-links';

export const adminNav: NavSection[] = [
  {
    title: 'Platform admin',
    items: [
      { href: '/admin/products', label: 'Termékek és csomagok', icon: <PackageIcon /> },
      { href: '/admin/orders', label: 'Rendelések és kulcsok', icon: <ReceiptIcon /> },
    ],
  },
  {
    title: 'Saját fiók',
    items: [{ href: '/dashboard', label: 'Vezérlőpult', icon: <LayoutDashboardIcon /> }],
  },
];
