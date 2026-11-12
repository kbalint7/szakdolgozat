import { Logo } from '@/components/logo';

export function AppHeader({ menu }: { menu: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur supports-backdrop-filter:bg-background/70 md:hidden">
      <div className="flex h-14 w-full items-center justify-between gap-3 px-4">
        <Logo href="/dashboard" />
        {menu}
      </div>
    </header>
  );
}
