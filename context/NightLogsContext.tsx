import { createContext, useContext, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';

import { logEntries } from '@/data/logEntries';
import type { NightLogEntry } from '@/data/logEntries';

type NightLogsContextValue = {
  nightLogs: NightLogEntry[];
  addNightLog: (nightLog: NightLogEntry) => void;
};

const NightLogsContext = createContext<NightLogsContextValue | null>(null);

export function NightLogsProvider({ children }: PropsWithChildren) {
  const [nightLogs, setNightLogs] = useState<NightLogEntry[]>(logEntries);

  const value = useMemo<NightLogsContextValue>(() => {
    return {
      nightLogs,
      addNightLog: (nightLog) => {
        setNightLogs((currentNightLogs) => [nightLog, ...currentNightLogs]);
      },
    };
  }, [nightLogs]);

  return (
    <NightLogsContext.Provider value={value}>
      {children}
    </NightLogsContext.Provider>
  );
}

export function useNightLogs() {
  const context = useContext(NightLogsContext);

  if (!context) {
    throw new Error('useNightLogs must be used inside NightLogsProvider');
  }

  return context;
}
