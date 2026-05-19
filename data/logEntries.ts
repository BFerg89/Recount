import type { DraftPerson } from './people';
import type { PromptedNoteType } from './promptedNotes';
import type { DraftTimelineMoment } from './timelineMoments';

export type NightLogPromptedNote = {
  id: string;
  promptType: PromptedNoteType;
  text: string;
};

export type NightLogEntry = {
  id: string;
  title: string;
  date: Date;
  generalLocation: string;
  people: DraftPerson[];
  timelineMoments: DraftTimelineMoment[];
  promptedNotes: NightLogPromptedNote[];
};

export const logEntries: NightLogEntry[] = [];
