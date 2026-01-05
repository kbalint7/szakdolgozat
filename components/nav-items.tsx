import { LogIn } from 'lucide-react';
import { ModeToggle } from '@/components/mode-toggle';
import { NavButton } from './nav-button';

export function NavItems() {
  return (
    <>
      <div className="flex items-center">
        <NavButton href="/login" label="Sign in" icon={LogIn} />
        <ModeToggle></ModeToggle>
      </div>
    </>
  );
}
