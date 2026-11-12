'use client';

import { ChevronsUpDownIcon, LayoutDashboardIcon, LogOutIcon, MonitorIcon, MoonIcon, SunIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { authClient } from '@/lib/auth/client';

type UserMenuProps = {
  user: { name: string; email: string };
  variant?: 'avatar' | 'row';
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('');
}

export function UserMenu({ user, variant = 'avatar' }: UserMenuProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  async function signOut() {
    const failed = await authClient.signOut().then(
      result => Boolean(result.error),
      () => true,
    );
    if (failed) {
      toast.error('Nem sikerült kijelentkezni.');
      return;
    }
    router.push('/');
    router.refresh();
  }

  const avatar = (
    <Avatar className={variant === 'row' ? 'size-7' : 'size-8'}>
      <AvatarFallback className="text-xs">{initials(user.name)}</AvatarFallback>
    </Avatar>
  );

  return (
    <DropdownMenu>
      {variant === 'row' ? (
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              aria-label="Felhasználói menü"
              className="flex w-full items-center gap-2.5 rounded-lg p-1.5 text-left text-sm transition-colors outline-none hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-ring aria-expanded:bg-sidebar-accent"
            />
          }
        >
          {avatar}
          <span className="min-w-0 flex-1 truncate font-medium">{user.name}</span>
          <ChevronsUpDownIcon aria-hidden className="mr-1 size-3.5 shrink-0 text-muted-foreground" />
        </DropdownMenuTrigger>
      ) : (
        <DropdownMenuTrigger
          render={<Button variant="ghost" size="icon" className="rounded-full" aria-label="Felhasználói menü" />}
        >
          {avatar}
        </DropdownMenuTrigger>
      )}
      <DropdownMenuContent
        align={variant === 'row' ? 'start' : 'end'}
        side={variant === 'row' ? 'top' : 'bottom'}
        className="w-56"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <div className="truncate font-medium text-foreground">{user.name}</div>
            <div className="truncate text-xs font-normal">{user.email}</div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {variant === 'row' ? (
          <DropdownMenuRadioGroup value={theme} onValueChange={setTheme} aria-label="Téma">
            <DropdownMenuRadioItem value="light">
              <SunIcon /> Világos
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="dark">
              <MoonIcon /> Sötét
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="system">
              <MonitorIcon /> Rendszer szerint
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        ) : (
          <DropdownMenuItem onClick={() => router.push('/dashboard')}>
            <LayoutDashboardIcon /> Vezérlőpult
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut}>
          <LogOutIcon /> Kijelentkezés
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
