import { createContext, useContext, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';

import { logEntries } from '@/data/logEntries';
import { promptedNoteDefinitions } from '@/data/promptedNotes';
import {
  formatDateForStorage,
  type CreateNightLogInput,
  type NightLogEntry,
  type NightLogNote,
} from '@/data/nightLogModels';

type NightLogsContextValue = {
  nightLogs: NightLogEntry[];
  createNightLog: (input: CreateNightLogInput) => void;
};

const NightLogsContext = createContext<NightLogsContextValue | null>(null);

export function NightLogsProvider({ children }: PropsWithChildren) {
  const [nightLogs, setNightLogs] = useState<NightLogEntry[]>(logEntries);

  const value = useMemo<NightLogsContextValue>(() => {
    return {
      nightLogs,
      createNightLog: (input) => {
        const createdAtMs = Date.now();
        const nightLogId = `local-night-log-${createdAtMs}`;
        const savedAt = new Date().toISOString();
        const people = input.people.map((person, index) => ({
          id: `night-person-${createdAtMs}-${index}`,
          nightLogId,
          displayName: person.displayName,
          createdAt: savedAt,
          updatedAt: savedAt,
        }));
        const timelineEvents = input.moments.map((moment, index) => ({
          id: `timeline-event-${createdAtMs}-${index}`,
          nightLogId,
          title: moment.title,
          approxTime: moment.approxTime,
          sortOrder: index,
          createdAt: savedAt,
          updatedAt: savedAt,
        }));
        const notes: NightLogNote[] = promptedNoteDefinitions
          .map((prompt) => {
            const text = (input.noteAnswers[prompt.promptType] ?? '').trim();

            if (!text) {
              return null;
            }

            return {
              id: `night-log-note-${createdAtMs}-${prompt.promptType}`,
              nightLogId,
              promptType: prompt.promptType,
              text,
              createdAt: savedAt,
              updatedAt: savedAt,
            };
          })
          .filter((note): note is NightLogNote => note !== null);
        const nightLog: NightLogEntry = {
          id: nightLogId,
          creatorId: null,
          title: input.title,
          date: formatDateForStorage(input.date),
          generalLocation: input.generalLocation,
          createdAt: savedAt,
          updatedAt: savedAt,
          people,
          timelineEvents,
          notes,
        };

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
