import { useSyncExternalStore } from 'react';
import { getEntries, subscribe } from './api/client';
import type { LogEntry } from './api/contract';

export { getEntries, subscribe };

export function useInspector(): LogEntry[] {
  return useSyncExternalStore(subscribe, getEntries, getEntries);
}
