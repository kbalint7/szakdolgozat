import { cn } from 'cn';

import { Logo } from '@/components/logo';
import { ModeToggle } from '@/components/mode-toggle';

export function Message({
  eyebrow,
  title,
  description,
  action,
  centered = false,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description: React.ReactNode;
  action: React.ReactNode;
  centered?: boolean;
}) {
  return (
    <div className={cn('flex w-full max-w-sm flex-col gap-6', centered ? 'items-center text-center' : 'items-start')}>
      <div className="space-y-1.5">
        {eyebrow && <p className="nums text-sm font-medium text-muted-foreground">{eyebrow}</p>}
        <h1 className="text-[1.625rem] leading-8 font-semibold tracking-tight text-balance">{title}</h1>
        <p className="text-sm/relaxed text-pretty text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function FocusFrame({ account, children }: { account?: React.ReactNode; children: React.ReactNode }) {
  return (
    <>
      <header className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-2 px-4">
        <Logo />
        <div className="flex items-center gap-1.5">
          <ModeToggle />
          {account}
        </div>
      </header>
      <main className="flex flex-1 flex-col items-center px-4 pt-8 pb-16 sm:justify-center sm:pt-6 sm:pb-[16vh]">
        {children}
      </main>
    </>
  );
}
