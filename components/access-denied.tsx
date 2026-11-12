import { LinkButton } from '@/components/link-button';
import { Message } from '@/components/message-screen';

export function AccessDenied({ message }: { message?: string }) {
  return (
    <Message
      title="Nincs jogosultságod"
      description={message ?? 'Ezt az oldalt csak a cég tulajdonosa vagy adminisztrátorai láthatják.'}
      action={<LinkButton href="/dashboard">Vissza a vezérlőpultra</LinkButton>}
    />
  );
}
