import { cn } from 'cn';
import { BookOpenIcon, InfoIcon, TriangleAlertIcon } from 'lucide-react';

const tones = {
  info: { icon: <InfoIcon />, classes: 'border-info/40 bg-info/5 text-foreground [&_svg]:text-info' },
  note: { icon: <BookOpenIcon />, classes: 'border-primary/40 bg-primary/5 text-foreground [&_svg]:text-primary' },
  warning: {
    icon: <TriangleAlertIcon />,
    classes: 'border-warning/50 bg-warning/8 text-foreground [&_svg]:text-warning',
  },
};

export function Callout({
  tone = 'note',
  title,
  children,
  className,
}: {
  tone?: keyof typeof tones;
  title?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  const { icon, classes } = tones[tone];
  return (
    <div
      className={cn(
        'flex gap-3 rounded-xl border-l-4 px-4 py-3 text-sm [&_svg]:mt-0.5 [&_svg]:size-4 [&_svg]:shrink-0',
        classes,
        className,
      )}
    >
      {icon}
      <div className="min-w-0 space-y-0.5 text-pretty">
        {title && <div className="font-medium">{title}</div>}
        <div className="text-muted-foreground [&_code]:text-foreground">{children}</div>
      </div>
    </div>
  );
}
