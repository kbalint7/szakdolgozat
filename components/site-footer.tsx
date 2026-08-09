import Link from 'next/link';

import { Logo } from '@/components/logo';

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex max-w-sm flex-col gap-3">
          <Logo />
          <p className="text-sm text-pretty text-muted-foreground">
            Vállalati szoftverlicencek kezelése munkakörök alapján, kézi kiosztás nélkül.
          </p>
        </div>
        <nav className="grid grid-cols-2 gap-x-10 gap-y-2 text-sm" aria-label="Lábléc">
          <Link href="/products" className="text-muted-foreground hover:text-foreground">
            Termékek
          </Link>
          <Link href="/#hogyan-mukodik" className="text-muted-foreground hover:text-foreground">
            Hogyan működik?
          </Link>
          <Link href="/login" className="text-muted-foreground hover:text-foreground">
            Bejelentkezés
          </Link>
          <Link href="/register" className="text-muted-foreground hover:text-foreground">
            Regisztráció
          </Link>
        </nav>
      </div>
      <div className="border-t">
        <div className="mx-auto w-full max-w-6xl px-4 py-4 text-xs text-muted-foreground">© 2026 Licenckezelő</div>
      </div>
    </footer>
  );
}
