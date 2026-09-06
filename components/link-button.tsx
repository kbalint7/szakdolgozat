import type { VariantProps } from 'class-variance-authority';
import { cn } from 'cn';
import Link from 'next/link';

import { buttonVariants } from '@/components/ui/button';

type LinkButtonProps = React.ComponentProps<typeof Link> & VariantProps<typeof buttonVariants>;

export function LinkButton({ className, variant, size, ...props }: LinkButtonProps) {
  return <Link className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
