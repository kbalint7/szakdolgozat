'use client';

import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useFormStatus } from 'react-dom';

export function SubmitButton({ text }: { text: string }) {
    const { pending } = useFormStatus();

    if (pending) {
        return (
            <Button disabled>
                <Loader2 className="animate-spin" />
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
