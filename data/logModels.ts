import type { CreatePersonInput } from './people';
import type { CreateTimelineEventInput } from './timelineMoments';
import type { PromptedNoteAnswers, PromptedNoteType } from './promptedNotes';

export type CreateLogInput = {
  title: string;
  date: Date;
  generalLocation: string;
  people: CreatePersonInput[];
  moments: CreateTimelineEventInput[];
  noteAnswers: PromptedNoteAnswers;
};

export type LogPerson = {
  id: string;
  logId: string;
  displayName: string;
  createdAt: string;
  updatedAt: string;
};

export type TimelineEvent = {
  id: string;
  logId: string;
  title: string;
  approxTime: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type LogNote = {
  id: string;
  logId: string;
  promptType: PromptedNoteType;
  text: string;
  createdAt: string;
  updatedAt: string;
};

export type LogEntry = {
  id: string;
  creatorId: string | null;
  title: string;
  date: string;
  generalLocation: string;
  createdAt: string;
  updatedAt: string;
  people: LogPerson[];
  timelineEvents: TimelineEvent[];
  notes: LogNote[];
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
