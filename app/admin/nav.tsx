import {
  BarChart3Icon,
  BuildingIcon,
  LayoutDashboardIcon,
  PackageIcon,
  ReceiptIcon,
  ScrollTextIcon,
} from 'lucide-react';

import type { NavSection } from '@/components/shell/nav-links';

export const adminNav: NavSection[] = [
  {
    title: 'Adminfelület',
    items: [
      { href: '/admin/products', label: 'Termékek', icon: <PackageIcon /> },
      { href: '/admin/orders', label: 'Rendelések', icon: <ReceiptIcon /> },
      { href: '/admin/stats', label: 'Statisztika', icon: <BarChart3Icon /> },
      { href: '/admin/companies', label: 'Cégek', icon: <BuildingIcon /> },
      { href: '/admin/audit', label: 'Auditnapló', icon: <ScrollTextIcon /> },
    ],
  },
  {
    title: 'Személyes',
    items: [{ href: '/dashboard', label: 'Vezérlőpult', icon: <LayoutDashboardIcon /> }],
  },
];
