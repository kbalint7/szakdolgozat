import { CheckCircle2Icon } from 'lucide-react';

import { Logo } from '@/components/logo';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const points = [
  'A helyeket munkakörök szerint osztja ki, nem kézzel',
  'Követi a belépéseket, munkakörváltásokat és kilépéseket',
  'A szoftver használat közben ellenőrzi a hozzáférést',
];

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1">
      <div className="hidden flex-col justify-between border-r bg-sidebar p-10 lg:flex lg:w-[42%] xl:w-[38%]">
        <Logo />
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold tracking-tight text-balance">
            Vállalati szoftverlicencek, kézi kiosztás nélkül
          </h2>
          <ul className="flex flex-col gap-3 text-sm text-muted-foreground">
            {points.map(point => (
              <li key={point} className="flex items-start gap-2">
                <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-success" aria-hidden /> {point}
              </li>
            ))}
          </ul>
        </div>
        <span />
      </div>
      <div className="flex flex-1 items-center justify-center p-4 sm:p-8">{children}</div>
    </div>
  );
}

export function AuthCard({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <Card className="w-full max-w-md [--card-spacing:--spacing(6)]">
      <CardHeader>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
      {footer && <CardFooter className="justify-center text-sm text-muted-foreground">{footer}</CardFooter>}
    </Card>
  );
}

export function AuthCardSkeleton() {
  return (
    <Card className="w-full max-w-md [--card-spacing:--spacing(6)]" aria-busy="true">
      <CardHeader>
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </CardContent>
    </Card>
  );
}
