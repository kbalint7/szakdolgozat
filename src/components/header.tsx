import { HomeIcon, LogIn, UsersRound, LogOut } from 'lucide-react';
import Link from 'next/link';

import { NavButton } from '@/components/nav-button';
import { ModeToggle } from '@/components/mode-toggle';
import { Button } from '@/components/ui/button';
import { auth, signOut } from '@/app/auth';

export async function Header() {
	const session = await auth();

	return (
		<header className="bg-background h-12 p-2 border-b sticky top-0 z-20">
			<div className="flex h-8 items-center justify-between w-full">
				<div className="flex items-center gap-2">
					<NavButton href="/home" label="Home" icon={HomeIcon} />
					<Link href="/home" className="flex justify-center items-center gap-2 ml-0" title="Home">
						<h1 className="hidden sm:block text-xl font-bold m-0 mt-1">Licenszkezelő</h1>
					</Link>
				</div>
				<div className="flex items-center">
					{!session?.user && <NavButton href="/login" label="Login" icon={LogIn} />}
					{session?.user && <NavButton href="/dashboard" label="Dashboard" icon={UsersRound} />}
					<ModeToggle></ModeToggle>
					{session?.user && (
						<Button
							onClick={async () => {
								'use server';
								await signOut({ redirectTo: '/home' });
							}}
							variant="ghost"
							size="icon"
							aria-label="LogOut"
							title="LogOut"
							className="rounded-full"
						>
							<LogOut />
						</Button>
					)}
				</div>
			</div>
		</header>
	);
}
