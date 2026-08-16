import { LockIcon } from 'lucide-react';

import { EmptyState } from '@/components/empty-state';

export function AccessDenied({ message }: { message?: string }) {
  return (
    <EmptyState
      icon={<LockIcon />}
      title="Nincs jogosultságod"
      description={message ?? 'Ezt az oldalt csak a cég tulajdonosa vagy adminisztrátorai láthatják.'}
    />
  );
}
