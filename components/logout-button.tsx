'use client';

import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

export function LogoutButton() {
    const router = useRouter();

    return (
        <Button
            onClick={async () => {
                await authClient.signOut({
                    fetchOptions: {
                        onSuccess: () => {
                            router.push('/login');
                            router.refresh();
                        },
                    },
                });
            }}
            variant="ghost"
            size="icon"
            aria-label="LogOut"
            title="LogOut"
            className="rounded-full">
            <LogOut />
        </Button>
    );
}
