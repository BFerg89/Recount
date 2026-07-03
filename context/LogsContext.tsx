import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';

import { useAuth } from '@/context/AuthContext';
import type { CreateLogInput, LogEntry, LogSummary, UpdateLogInput } from '@/features/logs/logTypes';
import { formatDateForStorage } from '@/features/logs/logDate';
import {
  createLog as createLogApi,
  deleteLog as deleteLogApi,
  fetchLogById,
  fetchLogSummaries,
  leaveLog as leaveLogApi,
  updateTimelineEvent,
  createTimelineEvent,
  deleteTimelineEvent,
  upsertLogNote,
  deleteLogNote,
  updateLogMetadata,
  createLogPerson,
  deleteLogPerson,
} from '@/features/logs/logsApi';
import { promptedNoteDefinitions } from '@/features/logs/promptedNotes';

type LogsContextValue = {
  logSummaries: LogSummary[];
  isLoading: boolean;
  error: string | null;
  refreshLogs: () => Promise<void>;
  getCachedLog: (logId: string) => LogEntry | null;
  loadLog: (logId: string) => Promise<LogEntry | null>;
  createLog: (input: CreateLogInput) => Promise<LogEntry>;
  deleteLog: (logId: string) => Promise<void>;
  leaveLog: (logId: string) => Promise<void>;
  updateLog: (input: UpdateLogInput) => Promise<LogEntry>;
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
  const [fullLogsById, setFullLogsById] = useState<Record<string, LogEntry>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshLogs = useCallback(async () => {
    if (isAuthLoading) {
      return;
    }

    if (!user) {
      setLogSummaries([]);
      setFullLogsById({});
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const fetchedLogSummaries = await fetchLogSummaries();
      const visibleLogIds = new Set(fetchedLogSummaries.map((log) => log.id));

      setLogSummaries(fetchedLogSummaries);
      setFullLogsById((currentLogs) => {
        return Object.fromEntries(
          Object.entries(currentLogs).filter(([logId]) => visibleLogIds.has(logId))
        );
      });
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

  const getCachedLog = useCallback((logId: string) => {
    return fullLogsById[logId] ?? null;
  }, [fullLogsById]);

  const loadLog = useCallback(async (logId: string) => {
    const cachedLog = fullLogsById[logId];

    if (cachedLog) {
      return cachedLog;
    }

    const fetchedLog = await fetchLogById(logId);

    if (fetchedLog) {
      setFullLogsById((currentLogs) => ({
        ...currentLogs,
        [fetchedLog.id]: fetchedLog,
      }));
    }

    return fetchedLog;
  }, [fullLogsById]);

  const createLog = useCallback(async (input: CreateLogInput) => {
    setError(null);

    const createdLog = await createLogApi(input);

    setLogSummaries((currentLogSummaries) => [
      toLogSummary(createdLog),
      ...currentLogSummaries.filter((log) => log.id !== createdLog.id),
    ]);
    setFullLogsById((currentLogs) => ({
      ...currentLogs,
      [createdLog.id]: createdLog,
    }));

    return createdLog;
  }, []);

  const deleteLog = useCallback(async (logId: string) => {
    setError(null);

    await deleteLogApi(logId);

    setLogSummaries((currentLogSummaries) =>
      currentLogSummaries.filter((log) => log.id !== logId)
    );
    setFullLogsById((currentLogs) => {
      const nextLogs = { ...currentLogs };
      delete nextLogs[logId];
      return nextLogs;
    });
  }, []);

  const leaveLog = useCallback(async (logId: string) => {
    setError(null);

    await leaveLogApi(logId);

    setLogSummaries((currentLogSummaries) =>
      currentLogSummaries.filter((log) => log.id !== logId)
    );
    setFullLogsById((currentLogs) => {
      const nextLogs = { ...currentLogs };
      delete nextLogs[logId];
      return nextLogs;
    });
  }, []);

  const updateLog = useCallback(async (inputLog: UpdateLogInput) => {
    setError(null);

    const originalLog = fullLogsById[inputLog.id] ?? await fetchLogById(inputLog.id);

    if (!originalLog) {
      throw new Error('Log not found.');
    }

    const nextTitle = inputLog.title.trim();
    const nextDate = formatDateForStorage(inputLog.date);
    const nextGeneralLocation = inputLog.generalLocation.trim();

    //Check/Update metadata
    if (originalLog.title !== nextTitle || originalLog.date !== nextDate || originalLog.generalLocation !== nextGeneralLocation) {
      await updateLogMetadata({
        id: inputLog.id,
        title: nextTitle,
        date: inputLog.date,
        generalLocation: nextGeneralLocation,
        expectedUpdatedAt: originalLog.updatedAt,
      });
    }

    //Check/Update people
    const originalPeopleById = new Map(
      originalLog.people.map((person) => [person.id, person])
    );

    for (const deletedPersonId of inputLog.deletedPersonIds ?? []) {
      const originalPerson = originalPeopleById.get(deletedPersonId);

      if (!originalPerson) {
        throw new Error('Person no longer exists.');
      }

      await deleteLogPerson({
        id: originalPerson.id,
        expectedUpdatedAt: originalPerson.updatedAt,
      });
    }
    for (const person of inputLog.people) {
      const displayName = person.displayName.trim();
      const userId = person.userId ?? null;
      const isNewPerson = !originalPeopleById.has(person.id);

      if (!displayName) {
        if (isNewPerson) continue;
        throw new Error('Person name is required.');
      }

      if (isNewPerson) {
        await createLogPerson({
          logId: inputLog.id,
          displayName,
          userId,
        });
      }
    }

    //Check/Update moments
    const originalMomentsById = new Map(
      originalLog.timelineEvents.map((moment) => [moment.id, moment])
    );

    for (const deletedMomentId of inputLog.deletedMomentIds ?? []) {
      const originalMoment = originalMomentsById.get(deletedMomentId);

      if (!originalMoment) {
        throw new Error('Timeline event no longer exists.');
      }

      await deleteTimelineEvent({
        id: originalMoment.id,
        expectedUpdatedAt: originalMoment.updatedAt,
      });
    }

    for (const moment of inputLog.moments) {
      const title = moment.title.trim();
      const approxTime = moment.approxTime?.trim() || null;
      const isLocalMoment = moment.id.startsWith('local-timeline-event-');

      if (!title) {
        if (isLocalMoment) continue;
        throw new Error('Timeline event title is required.');
      }

      if (isLocalMoment) {
        await createTimelineEvent({
          logId: inputLog.id,
          title,
          approxTime,
        });
        continue;
      }

      const originalMoment = originalMomentsById.get(moment.id);

      if (!originalMoment) {
        throw new Error('Timeline event no longer exists.');
      }

      if (title !== originalMoment.title || approxTime !== originalMoment.approxTime) {
        await updateTimelineEvent({
          id: moment.id,
          title,
          approxTime,
          expectedUpdatedAt: originalMoment.updatedAt,
        });
      }
    }

    //Check/Update notes
    const originalNotesByPromptType = new Map(
      originalLog.notes.map((note) => [note.promptType, note])
    );

    for (const prompt of promptedNoteDefinitions) {
      const nextText = (inputLog.noteAnswers[prompt.promptType] ?? '').trim();
      const originalNote = originalNotesByPromptType.get(prompt.promptType);

      if (!nextText && originalNote) {
        await deleteLogNote({
          id: originalNote.id,
          expectedUpdatedAt: originalNote.updatedAt,
        });
        continue;
      }

      if (nextText && !originalNote) {
        await upsertLogNote({
          logId: inputLog.id,
          promptType: prompt.promptType,
          text: nextText,
        })
        continue;
      }

      if (nextText && originalNote && nextText !== originalNote.text) {
        await upsertLogNote({
          logId: inputLog.id,
          promptType: prompt.promptType,
          text: nextText,
          noteId: originalNote.id,
          expectedUpdatedAt: originalNote.updatedAt,
        });
      }
    }

    const updatedLog = await fetchLogById(inputLog.id);

    if (!updatedLog) {
      throw new Error('Log was not returned after update.');
    }

    setFullLogsById((currentLogs) => ({
      ...currentLogs,
      [updatedLog.id]: updatedLog,
    }));

    setLogSummaries((currentLogSummaries) => {
      const updatedSummary = toLogSummary(updatedLog);
      const hasSummary = currentLogSummaries.some((summary) => summary.id === updatedLog.id);

      if (!hasSummary) {
        return [updatedSummary, ...currentLogSummaries];
      }

      return currentLogSummaries.map((summary) =>
        summary.id === updatedLog.id ? updatedSummary : summary
      );
    });

    return updatedLog;
  }, [fullLogsById]);

  const value = useMemo<LogsContextValue>(() => {
    return {
      logSummaries,
      isLoading,
      error,
      refreshLogs,
      getCachedLog,
      loadLog,
      createLog,
      deleteLog,
      leaveLog,
      updateLog,
    };
  }, [
    logSummaries,
    isLoading,
    error,
    refreshLogs,
    getCachedLog,
    loadLog,
    createLog,
    deleteLog,
    leaveLog,
    updateLog,
  ]);

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
