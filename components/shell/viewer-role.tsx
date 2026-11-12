'use client';

import { createContext, useContext, useEffect, useState, useSyncExternalStore } from 'react';

import type { Role } from '@/lib/domain/permissions';

type Store = {
  get: () => Role | undefined;
  set: (role: Role | undefined) => void;
  subscribe: (listener: () => void) => () => void;
};

function createStore(): Store {
  let role: Role | undefined;
  const listeners = new Set<() => void>();
  return {
    get: () => role,
    set(next) {
      if (next === role) return;
      role = next;
      listeners.forEach(listener => listener());
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

const ViewerRoleContext = createContext<Store | null>(null);

export function ViewerRoleProvider({ children }: { children: React.ReactNode }) {
  const [store] = useState(createStore);
  return <ViewerRoleContext value={store}>{children}</ViewerRoleContext>;
}

export function useReportViewerRole(role: Role | undefined) {
  const store = useContext(ViewerRoleContext);
  useEffect(() => {
    store?.set(role);
  }, [store, role]);
}

const subscribeToNothing = () => () => {};

export function useViewerRole(): Role | undefined {
  const store = useContext(ViewerRoleContext);
  return useSyncExternalStore(
    store?.subscribe ?? subscribeToNothing,
    () => store?.get(),
    () => undefined,
  );
}
