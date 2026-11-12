'use client';

import { MenuIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

export function MobileNav({
  title = 'Menü',
  account,
  children,
}: {
  title?: string;
  account?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener('popstate', close);
    return () => window.removeEventListener('popstate', close);
  }, [open]);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="ghost" size="icon" className="-mr-1.5" aria-label="Menü megnyitása" />}>
        <MenuIcon />
      </SheetTrigger>
      <SheetContent side="right" className="gap-0 bg-sidebar data-[side=right]:w-72">
        <SheetHeader className="h-14 shrink-0 justify-center px-5 py-0">
          <Logo href="/dashboard" />
          <SheetTitle className="sr-only">{title}</SheetTitle>
        </SheetHeader>
        <div
          className="flex-1 overflow-y-auto px-3 pt-3 pb-4"
          onClickCapture={event => {
            if ((event.target as HTMLElement).closest('a')) setOpen(false);
          }}
        >
          {children}
        </div>
        {account}
      </SheetContent>
    </Sheet>
  );
}
