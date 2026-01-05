'use client';

import { Button } from '@/components/ui/button';
import { useFormStatus } from 'react-dom';
import { Spinner } from './ui/spinner';

export function SubmitButton({ text }: { text: string }) {
  const { pending } = useFormStatus();

  if (pending) {
    return (
      <Button disabled>
        <Spinner className="animate-spin" />
        {text}
      </Button>
    );
  }

  return (
    <Button className="w-full text-md" type="submit">
      {text}
    </Button>
  );
}
