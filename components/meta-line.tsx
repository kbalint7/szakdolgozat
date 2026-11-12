import { cn } from 'cn';

export function MetaLine({ items, className }: { items: React.ReactNode[]; className?: string }) {
  const shown = items.filter(item => item !== null && item !== undefined && item !== false && item !== '');
  if (shown.length === 0) return null;
  return (
    <span className={cn('nums block overflow-hidden text-[13px] leading-[1.125rem] text-muted-foreground', className)}>
      <span className="-ml-[1em] flex flex-wrap">
        {shown.map((item, index) => (
          <span
            key={index}
            className="whitespace-nowrap before:inline-block before:w-[1em] before:text-center before:content-['·']"
          >
            {item}
          </span>
        ))}
      </span>
    </span>
  );
}
