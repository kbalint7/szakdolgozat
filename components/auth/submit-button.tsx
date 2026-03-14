'use client';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

export function SubmitButton({ text, loading, ...props }: { text: string; loading: boolean } & React.ComponentProps<typeof Button>) {
  if (loading) {
    return (
      <Button disabled>
        <Spinner />
        {text}
      </Button>
    );
  }

  return (
    <Button className="w-full text-md" type="submit" {...props}>
      {text}
    </Button>
  );
}
