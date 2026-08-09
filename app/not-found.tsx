import { FileQuestionIcon } from 'lucide-react';

import { EmptyState } from '@/components/empty-state';
import { LinkButton } from '@/components/link-button';

export default function NotFound() {
  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <EmptyState
        className="max-w-md border-0 bg-transparent"
        icon={<FileQuestionIcon />}
        title="Az oldal nem található"
        description="A keresett oldal nem létezik, vagy nincs hozzá hozzáférésed."
        action={<LinkButton href="/">Vissza a kezdőlapra</LinkButton>}
      />
    </main>
  );
}
