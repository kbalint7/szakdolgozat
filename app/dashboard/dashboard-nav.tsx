'use client';

import {
  ArmchairIcon,
  BuildingIcon,
  LayoutDashboardIcon,
  PlusIcon,
  SettingsIcon,
  ShieldIcon,
  UserIcon,
  UsersIcon,
} from 'lucide-react';
import { useParams } from 'next/navigation';

import { NavLinks, type NavItem, type NavSection } from '@/components/shell/nav-links';
import { can, roleLabels, type CompanyAction, type Role } from '@/lib/domain/permissions';

type CompanyLink = { id: string; name: string; role: Role };

type CompanyNavItem = NavItem & { action: CompanyAction };

function companyItems(companyId: string): CompanyNavItem[] {
  const base = `/dashboard/companies/${companyId}`;
  return [
    { href: `${base}/members`, label: 'Tagok', icon: <UsersIcon />, action: 'members.view' },
    { href: `${base}/licenses`, label: 'Licencek és helyek', icon: <ArmchairIcon />, action: 'licenses.view' },
    { href: `${base}/settings`, label: 'Beállítások', icon: <SettingsIcon />, action: 'company.view' },
  ];
}

export function DashboardNav({ companies, isPlatformAdmin }: { companies: CompanyLink[]; isPlatformAdmin: boolean }) {
  const params = useParams<{ companyId?: string }>();

  const sections: NavSection[] = [
    {
      title: 'Személyes',
      items: [
        { href: '/dashboard', label: 'Áttekintés', icon: <LayoutDashboardIcon />, exact: true },
        { href: '/dashboard/profile', label: 'Profil', icon: <UserIcon /> },
      ],
    },
    {
      title: 'Cégeim',
      items: [
        ...companies.map(company => {
          const active = company.id === params.companyId;
          return {
            href: `/dashboard/companies/${company.id}`,
            label: company.name,
            icon: <BuildingIcon />,
            exact: true,
            meta: active ? roleLabels[company.role] : undefined,
            children: active
              ? companyItems(company.id)
                  .filter(item => can(company.role, item.action))
                  .map(({ action: _action, ...item }) => item)
              : undefined,
          };
        }),
        { href: '/dashboard/companies/new', label: 'Új cég', icon: <PlusIcon />, exact: true },
      ],
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
