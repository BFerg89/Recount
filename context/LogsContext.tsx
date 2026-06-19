import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';

import { useAuth } from '@/context/AuthContext';
import type { CreateLogInput, LogEntry, LogSummary } from '@/features/logs/logTypes';
import {
  createLog as createLogApi,
  deleteLog as deleteLogApi,
  leaveLog as leaveLogApi,
  fetchLogSummaries,
} from '@/features/logs/logsApi';

type LogsContextValue = {
  logSummaries: LogSummary[];
  isLoading: boolean;
  error: string | null;
  refreshLogs: () => Promise<void>;
  createLog: (input: CreateLogInput) => Promise<LogEntry>;
  deleteLog: (logId: string) => Promise<void>;
  leaveLog: (logId: string) => Promise<void>;
};

const LogsContext = createContext<LogsContextValue | null>(null);

const toLogSummary = (log: LogEntry): LogSummary => ({
  id: log.id,
  creatorId: log.creatorId,
  title: log.title,
  date: log.date,
  generalLocation: log.generalLocation,
  createdAt: log.createdAt,
  updatedAt: log.updatedAt,
});

export function LogsProvider({ children }: PropsWithChildren) {
  const { user, isLoading: isAuthLoading } = useAuth();

  const [logSummaries, setLogSummaries] = useState<LogSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshLogs = useCallback(async () => {
    if (isAuthLoading) {
      return;
    }

    if (!user) {
      setLogSummaries([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const fetchedLogSummaries = await fetchLogSummaries();
      setLogSummaries(fetchedLogSummaries);
    } catch (caughtError) {
      const message = caughtError instanceof Error
        ? caughtError.message
        : 'Unable to load logs.';
      setError(message);
      setLogSummaries([]);
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

    setLogSummaries((currentLogSummaries) => [
      toLogSummary(createdLog),
      ...currentLogSummaries.filter((log) => log.id !== createdLog.id),
    ]);

    return createdLog;
  }, []);

  const deleteLog = useCallback(async (logId: string) => {
    setError(null);

    await deleteLogApi(logId);

    setLogSummaries((currentLogSummaries) =>
      currentLogSummaries.filter((log) => log.id !== logId)
    );
  }, []);

  const leaveLog = useCallback(async (logId: string) => {
    setError(null);

    await leaveLogApi(logId);

    setLogSummaries((currentLogSummaries) =>
    currentLogSummaries.filter((log => log.id !== logId))
    );
  }, []);

  const value = useMemo<LogsContextValue>(() => {
    return {
      logSummaries,
      isLoading,
      error,
      refreshLogs,
      createLog,
      deleteLog,
      leaveLog,
    };
  }, [logSummaries, isLoading, error, refreshLogs, createLog, deleteLog, leaveLog]);

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
