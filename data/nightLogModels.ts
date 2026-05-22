import type { CreatePersonInput } from './people';
import type { CreateTimelineEventInput } from './timelineMoments';
import type { PromptedNoteAnswers, PromptedNoteType } from './promptedNotes';

export type CreateNightLogInput = {
  title: string;
  date: Date;
  generalLocation: string;
  people: CreatePersonInput[];
  moments: CreateTimelineEventInput[];
  noteAnswers: PromptedNoteAnswers;
};

export type NightPerson = {
  id: string;
  nightLogId: string;
  displayName: string;
  createdAt: string;
  updatedAt: string;
};

export type TimelineEvent = {
  id: string;
  nightLogId: string;
  title: string;
  approxTime: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type NightLogNote = {
  id: string;
  nightLogId: string;
  promptType: PromptedNoteType;
  text: string;
  createdAt: string;
  updatedAt: string;
};

export type NightLogEntry = {
  id: string;
  creatorId: string | null;
  title: string;
  date: string;
  generalLocation: string;
  createdAt: string;
  updatedAt: string;
  people: NightPerson[];
  timelineEvents: TimelineEvent[];
  notes: NightLogNote[];
};

export const formatDateForStorage = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

export const parseStoredDate = (date: string) => {
  const [year, month, day] = date.split('-').map(Number);

  return new Date(year, month - 1, day);
};
