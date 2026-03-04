import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-7xl flex-col items-center justify-center gap-4 px-4 py-8 text-center">
      <h1 className="text-2xl font-semibold">Az oldal nem található</h1>
      <p className="text-muted-foreground">A keresett oldal nem létezik, vagy áthelyezték.</p>
      <Button asChild>
        <Link href="/">Vissza a főoldalra</Link>
      </Button>
    </main>
  );
}
