import type { PromptedNoteAnswers, PromptedNoteType } from './promptedNotes';

export type CreatePersonInput = {
  id: string;
  displayName: string;
  userId?: string | null;
};

export type CreateTimelineEventInput = {
  id: string;
  approxTime: string | null;
  title: string;
};

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
  userId: string | null;
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

export type UpdateLogInput = {
  id: string;
  title: string;
  date: Date;
  generalLocation: string;
  people: CreatePersonInput[];
  deletedPersonIds?: string[];
  moments: CreateTimelineEventInput[];
  deletedMomentIds?: string[];
  noteAnswers: PromptedNoteAnswers;
};

export type LogSummary = {
  id: string;
  creatorId: string | null;
  title: string;
  date: string;
  generalLocation: string;
  createdAt: string;
  updatedAt: string;
}
