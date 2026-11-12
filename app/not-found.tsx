import { LinkButton } from '@/components/link-button';
import { FocusFrame, Message } from '@/components/message-screen';

export default function NotFound() {
  return (
    <FocusFrame>
      <Message
        centered
        eyebrow="404"
        title="Az oldal nem található"
        description="A keresett oldal nem létezik, vagy nem férsz hozzá."
        action={<LinkButton href="/">Vissza a kezdőlapra</LinkButton>}
      />
    </FocusFrame>
  );
}
