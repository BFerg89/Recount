import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';

import { useAuth } from '@/context/AuthContext';
import type { CreateLogInput, LogEntry } from '@/data/logModels';
import {
  createLog as createLogApi,
  fetchLogs,
} from '@/lib/logsApi';

type LogsContextValue = {
  logs: LogEntry[];
  isLoading: boolean;
  error: string | null;
  refreshLogs: () => Promise<void>;
  createLog: (input: CreateLogInput) => Promise<LogEntry>;
};

const LogsContext = createContext<LogsContextValue | null>(null);

export function LogsProvider({ children }: PropsWithChildren) {
  const { user, isLoading: isAuthLoading } = useAuth();

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshLogs = useCallback(async () => {
    if (isAuthLoading) {
      return;
    }

    if (!user) {
      setLogs([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const fetchedLogs = await fetchLogs();
      setLogs(fetchedLogs);
    } catch (caughtError) {
      const message = caughtError instanceof Error
        ? caughtError.message
        : 'Unable to load logs.';
      setError(message);
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthLoading, user]);

  useEffect(() => {
    refreshLogs();
  }, [refreshLogs]);

  const createLog = useCallback(async (input: CreateLogInput) => {
    setError(null);

    const createdLog = await createLogApi(input);

    setLogs((currentLogs) => [
      createdLog,
      ...currentLogs.filter((log) => log.id !== createdLog.id),
    ]);

    return createdLog;
  }, []);

  const value = useMemo<LogsContextValue>(() => {
    return {
      logs,
      isLoading,
      error,
      refreshLogs,
      createLog,
    };
  }, [logs, isLoading, error, refreshLogs, createLog]);

  return (
    <LogsContext.Provider value={value}>
      {children}
    </LogsContext.Provider>
  );
}

export function useLogs() {
  const context = useContext(LogsContext);

  if (!context) {
    throw new Error('useLogs must be used inside LogsProvider');
  }

  return context;
}
