import { connection } from 'next/server';
import { Suspense } from 'react';

import { FocusFrame } from '@/components/message-screen';
import { UserMenu } from '@/components/user-menu';
import { getSession } from '@/lib/auth/session';

async function SignedInUser() {
  await connection();
  const session = await getSession();
  if (!session) return null;
  const { name, email } = session.user;
  return <UserMenu user={{ name, email }} />;
}

export default function AuthLayout({ children }: LayoutProps<'/'>) {
  return (
    <FocusFrame
      account={
        <Suspense fallback={null}>
          <SignedInUser />
        </Suspense>
      }
    >
      {children}
    </FocusFrame>
  );
}
