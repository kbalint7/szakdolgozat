'use client';

import { MenuIcon } from 'lucide-react';
import { useState } from 'react';

import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

export function MobileNav({ title = 'Menü', children }: { title?: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={<Button variant="ghost" size="icon" className="-ml-1 md:hidden" aria-label="Menü megnyitása" />}
      >
        <MenuIcon />
      </SheetTrigger>
      <SheetContent side="left" className="w-72 bg-sidebar">
        <SheetHeader className="border-b border-sidebar-border">
          <Logo href="/dashboard" />
          <SheetTitle className="sr-only">{title}</SheetTitle>
        </SheetHeader>
        <div
          className="overflow-y-auto px-3 pb-4"
          onClickCapture={event => {
            if ((event.target as HTMLElement).closest('a')) setOpen(false);
          }}
        >
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}
