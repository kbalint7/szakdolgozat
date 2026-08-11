import { Logo } from '@/components/logo';

export function Sidebar({ children, footer }: { children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <>
      <div className="flex h-14 shrink-0 items-center border-b border-sidebar-border px-4">
        <Logo href="/dashboard" />
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-4">{children}</div>
      {footer && (
        <div className="shrink-0 border-t border-sidebar-border px-4 py-3 text-xs text-muted-foreground">{footer}</div>
      )}
    </>
  );
}
