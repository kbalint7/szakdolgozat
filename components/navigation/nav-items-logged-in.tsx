import { UsersRound } from 'lucide-react';
import { LogoutButton } from '@/components/auth/logout-button';
import { ModeToggle } from './mode-toggle';
import { NavButton } from './nav-button';

export function NavItemsLoggedIn() {
  return (
    <div className="flex items-center">
      <NavButton href="/dashboard" label="Dashboard" icon={UsersRound} />
      <ModeToggle></ModeToggle>
      <LogoutButton />
    </div>
  );
}
