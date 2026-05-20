import type { DraftPerson } from './people';
import type { PromptedNoteType } from './promptedNotes';
import type { DraftTimelineMoment } from './timelineMoments';

import { placeholderPeople } from './people';
import { placeholderMoments } from './timelineMoments';

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

export const logEntries: NightLogEntry[] = [
  {
    id: 'testId',
    title: 'Test Night',
    date: new Date(),
    generalLocation: 'Test City',
    people: placeholderPeople,
    timelineMoments: placeholderMoments,
    promptedNotes: [],
  }
];
