export function AppShell({
  sidebar,
  header,
  children,
}: {
  sidebar: React.ReactNode;
  header: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh">
      <aside className="sticky top-0 hidden h-svh w-62 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        {sidebar}
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        {header}
        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-7 px-4 py-6 md:px-10 md:pt-10 md:pb-16">
          {children}
        </main>
      </div>
    </div>
  );
}
