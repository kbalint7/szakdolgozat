import { UsersRound } from 'lucide-react';
import { ModeToggle } from '@/components/mode-toggle';
import { LogoutButton } from './logout-button';
import { NavButton } from './nav-button';

export async function NavItemsLoggedIn() {
  return (
    <div className="flex items-center">
      <NavButton href="/dashboard" label="Dashboard" icon={UsersRound} />
      <ModeToggle></ModeToggle>
      <LogoutButton />
    </div>
  );
}
