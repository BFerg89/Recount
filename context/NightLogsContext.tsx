import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';

import { useAuth } from '@/context/AuthContext';
import type { CreateNightLogInput, NightLogEntry } from '@/data/nightLogModels';
import { 
  createNightLog as createNightLogApi,
  fetchNightLogs,
} from '@/lib/nightLogsApi';

type NightLogsContextValue = {
  nightLogs: NightLogEntry[];
  isLoading: boolean;
  error: string | null;
  refreshNightLogs: () => Promise<void>;
  createNightLog: (input: CreateNightLogInput) => Promise<NightLogEntry>;
};

const NightLogsContext = createContext<NightLogsContextValue | null>(null);

export function NightLogsProvider({ children }: PropsWithChildren) {
  const { user, isLoading: isAuthLoading } = useAuth();

  const [nightLogs, setNightLogs] = useState<NightLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshNightLogs = useCallback(async () => {
    if (isAuthLoading) {
      return;
    }

    if (!user) {
      setNightLogs([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const fetchedNightLogs = await fetchNightLogs();
      setNightLogs(fetchedNightLogs);
    } catch (caughtError) {
      const message = caughtError instanceof Error
        ? caughtError.message
        : 'Unable to load Night Logs.';
      setError(message);
      setNightLogs([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthLoading, user]);

  useEffect(() => {
    refreshNightLogs();
  }, [refreshNightLogs]);

  const createNightLog = useCallback(async (input: CreateNightLogInput) => {
    setError(null);

    const createdNightLog = await createNightLogApi(input);

    setNightLogs((currentNightLogs) => [
      createdNightLog,
      ...currentNightLogs.filter((nightLog) => nightLog.id !== createdNightLog.id),
    ]);

    return createdNightLog;
  }, []);

  const value = useMemo<NightLogsContextValue>(() => {
    return {
      nightLogs,
      isLoading,
      error,
      refreshNightLogs,
      createNightLog,
    };
  }, [nightLogs, isLoading, error, refreshNightLogs, createNightLog]);

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