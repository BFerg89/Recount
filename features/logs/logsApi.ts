import { formatDateForStorage } from '@/features/logs/logDate';
import { promptedNoteDefinitions } from '@/features/logs/promptedNotes';
import type {
  CreateLogInput,
  LogEntry,
  LogNote,
  LogPerson,
  LogSummary,
  TimelineEvent,
} from '@/features/logs/logTypes';
import { supabase } from '@/lib/supabase';

type CreateLogRpcPayload = {
  title: string;
  date: string;
  general_location: string;
  people: { display_name: string; user_id: string | null }[];
  timeline_events: { title: string; approx_time: string | null }[];
  notes: { prompt_type: LogNote['promptType']; text: string }[];
};

type LogRow = {
  id: string;
  creator_id: string | null;
  title: string;
  date: string;
  general_location: string;
  created_at: string;
  updated_at: string;
};

type LogPersonRow = {
  id: string;
  user_id: string | null;
  log_id: string;
  display_name: string;
  created_at: string;
  updated_at: string;
};

type TimelineEventRow = {
  id: string;
  log_id: string;
  title: string;
  approx_time: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

type NoteRow = {
  id: string;
  log_id: string;
  prompt_type: LogNote['promptType'];
  text: string;
  created_at: string;
  updated_at: string;
};

type LogWithChildrenRow = LogRow & {
  log_people: LogPersonRow[] | null;
  timeline_events: TimelineEventRow[] | null;
  notes: NoteRow[] | null;
};

const toError = (error: unknown, fallbackMessage = 'Unknown log API error.') => {
  if (error instanceof Error) {
    return error;
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string' &&
    error.message.trim().length > 0
  ) {
    return new Error(error.message);
  }

  return new Error(fallbackMessage);
};

const mapLogPerson = (row: LogPersonRow): LogPerson => {
  return {
    id: row.id,
    userId: row.user_id,
    logId: row.log_id,
    displayName: row.display_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

const mapTimelineEvent = (row: TimelineEventRow): TimelineEvent => {
  return {
    id: row.id,
    logId: row.log_id,
    title: row.title,
    approxTime: row.approx_time,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

const mapLogNote = (row: NoteRow): LogNote => {
  return {
    id: row.id,
    logId: row.log_id,
    promptType: row.prompt_type,
    text: row.text,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

const mapLogSummary = (
  row: LogRow
): LogSummary => {
  return {
    id: row.id,
    creatorId: row.creator_id,
    title: row.title,
    date: row.date,
    generalLocation: row.general_location,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

const mapLog = (
  row: LogRow,
  people: LogPersonRow[],
  timelineEvents: TimelineEventRow[],
  notes: NoteRow[]
): LogEntry => {
  return {
    id: row.id,
    creatorId: row.creator_id,
    title: row.title,
    date: row.date,
    generalLocation: row.general_location,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    people: people.map(mapLogPerson),
    timelineEvents: timelineEvents
      .map(mapTimelineEvent)
      .sort((a, b) => a.sortOrder - b.sortOrder),
    notes: notes.map(mapLogNote),
  };
};

export async function createLog(input: CreateLogInput): Promise<LogEntry> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    throw toError(sessionError);
  }

  if (!sessionData.session) {
    throw new Error('You must be signed in to create a log.');
  }

  const payload: CreateLogRpcPayload = {
    title: input.title.trim(),
    date: formatDateForStorage(input.date),
    general_location: input.generalLocation.trim(),
    people: input.people.map((person) => ({
      display_name: person.displayName.trim(),
      user_id: person.userId ?? null,
    })).filter((person) => person.display_name.length > 0),
    timeline_events: input.moments.map((moment) => ({
      title: moment.title.trim(),
      approx_time: moment.approxTime?.trim() || null,
    })).filter((moment) => moment.title.length > 0),
    notes: promptedNoteDefinitions.map((prompt) => ({
      prompt_type: prompt.promptType,
      text: (input.noteAnswers[prompt.promptType] ?? '').trim(),
    })).filter((note) => note.text.length > 0),
  };

  const { data, error } = await supabase.rpc('create_log', { payload });

  if (error) {
    throw toError(error);
  }

  if (!data) {
    throw new Error('Log was not returned after creation.');
  }

  const createdLog = data as LogWithChildrenRow;

  return mapLog(
    createdLog,
    createdLog.log_people ?? [],
    createdLog.timeline_events ?? [],
    createdLog.notes ?? []
  );
}

export async function fetchLogSummaries(): Promise<LogSummary[]> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    throw toError(sessionError);
  }

  if (!sessionData.session) {
    return [];
  }

  const { data, error } = await supabase
    .from('logs')
    .select(`
      id,
      creator_id,
      title,
      date,
      general_location,
      created_at,
      updated_at
    `)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    throw toError(error);
  }

  const rows = (data ?? []) as LogRow[];

  return rows.map((row) => mapLogSummary(row));
}

export async function fetchLogById(logId: string): Promise<LogEntry | null> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    throw toError(sessionError);
  }

  if (!sessionData.session) {
    return null;
  }

  const { data, error } = await supabase
    .from('logs')
    .select(`
      id,
      creator_id,
      title,
      date,
      general_location,
      created_at,
      updated_at,
      log_people (
        id,
        user_id,
        log_id,
        display_name,
        created_at,
        updated_at
      ),
      timeline_events (
        id,
        log_id,
        title,
        approx_time,
        sort_order,
        created_at,
        updated_at
      ),
      notes (
        id,
        log_id,
        prompt_type,
        text,
        created_at,
        updated_at
      )
    `)
    .eq('id', logId)
    .maybeSingle();

  if (error) {
    throw toError(error);
  }

  if (!data) {
    return null;
  }

  const row = data as LogWithChildrenRow;

  return mapLog(
    row,
    row.log_people ?? [],
    row.timeline_events ?? [],
    row.notes ?? []
  );
}

export async function leaveLog(logId: string): Promise<void> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    throw toError(sessionError);
  }

  if (!sessionData.session) {
    throw new Error('You must be signed in to leave a log.');
  }

  const userId = sessionData.session.user.id;

  const { data, error } = await supabase
    .from('log_people')
    .delete()
    .eq('log_id', logId)
    .eq('user_id', userId)
    .select('id')
    .maybeSingle();

  if (error) {
    throw toError(error, 'Could not leave log.');
  }

  if (!data) {
    throw new Error('Log not found.');
  }
}

export async function deleteLog(logId: string): Promise<void> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    throw toError(sessionError);
  }

  if (!sessionData.session) {
    throw new Error('You must be signed in to delete a log.');
  }

  const { data, error } = await supabase
    .from('logs')
    .delete()
    .eq('id', logId)
    .select('id')
    .maybeSingle();

  if (error) {
    throw toError(error, 'Could not delete log.');
  }

  if (!data) {
    throw new Error('Log not found or you do not have permission to delete it.');
  }
}

export async function updateLogMetadata(input: {
  id: string;
  title: string;
  date: Date;
  generalLocation: string;
  expectedUpdatedAt: string;
}): Promise<LogSummary> {
  const { data, error } = await supabase.rpc('update_log_metadata', {
    p_log_id: input.id,
    p_title: input.title.trim(),
    p_date: formatDateForStorage(input.date),
    p_general_location: input.generalLocation.trim(),
    p_expected_updated_at: input.expectedUpdatedAt,
  });

  if (error) {
    throw toError(error);
  }

  if (!data) {
    throw new Error('Log was not returned after update.');
  }

  return mapLogSummary(data as LogRow);
}

export async function createTimelineEvent(input: {
  logId: string;
  title: string;
  approxTime: string | null;
}) : Promise<TimelineEvent> {
  const { data, error } = await supabase.rpc('create_timeline_event', {
    p_log_id: input.logId,
    p_title: input.title.trim(),
    p_approx_time: input.approxTime?.trim() || null,
  });

  if (error) {
    throw toError(error);
  }

  if (!data) {
    throw new Error('Timeline event was not returned after creation');
  }

  return mapTimelineEvent(data as TimelineEventRow);
}

export async function updateTimelineEvent(input: {
  id: string;
  title: string;
  approxTime: string | null;
  expectedUpdatedAt: string;
}) : Promise<TimelineEvent> {
  const { data, error } = await supabase.rpc('update_timeline_event', {
    p_timeline_event_id: input.id,
    p_title: input.title.trim(),
    p_approx_time: input.approxTime?.trim() || null,
    p_expected_updated_at: input.expectedUpdatedAt,
  });

  if (error) {
    throw toError(error);
  }

  if (!data) {
    throw new Error('Timeline event was not returned after update.');
  }

  return mapTimelineEvent(data as TimelineEventRow);
}

export async function deleteTimelineEvent(input: {
  id: string;
  expectedUpdatedAt: string;
}): Promise<void> {
  const { data, error } = await supabase.rpc('delete_timeline_event', {
    p_timeline_event_id: input.id,
    p_expected_updated_at: input.expectedUpdatedAt,
  });

  if (error) {
    throw toError(error);
  }

  if (!data) {
    throw new Error('Timeline event was not returned after delete.');
  }
}

export async function upsertLogNote(input: {
  logId: string;
  promptType: LogNote['promptType'];
  text: string;
  noteId?: string | null;
  expectedUpdatedAt?: string | null;
}): Promise<LogNote> {
  const { data, error } = await supabase.rpc('upsert_log_note', {
    p_log_id: input.logId,
    p_prompt_type: input.promptType,
    p_text: input.text.trim(),
    p_note_id: input.noteId ?? null,
    p_expected_updated_at: input.expectedUpdatedAt ?? null,
  });

  if (error) {
    throw toError(error);
  }

  if (!data) {
    throw new Error('Note was not returned after save.');
  }

  return mapLogNote(data as NoteRow);
}

export async function deleteLogNote(input: {
  id: string;
  expectedUpdatedAt: string;
}): Promise<void> {
  const { data, error } = await supabase.rpc('delete_log_note', {
    p_note_id: input.id,
    p_expected_updated_at: input.expectedUpdatedAt,
  });

  if (error) {
    throw toError(error);
  }

  if (!data) {
    throw new Error('Note was not returned after delete.');
  }
}

export async function createLogPerson(input: {
  logId: string;
  displayName: string;
  userId: string | null;
}) : Promise<LogPerson> {
  const { data, error } = await supabase.rpc('create_log_person', {
    p_log_id: input.logId,
    p_display_name: input.displayName,
    p_user_id: input.userId,
  });

  if (error) {
    throw toError(error);
  }

  if (!data) {
    throw new Error('Person was not returned after creation.');
  }

  return mapLogPerson(data as LogPersonRow);
}

export async function deleteLogPerson(input: {
  id: string;
  expectedUpdatedAt: string;
}) : Promise<void> {
  const { data, error } = await supabase.rpc('delete_log_person', {
    p_log_person_id: input.id,
    p_expected_updated_at: input.expectedUpdatedAt,
  });

  if (error) {
    throw toError(error);
  }

  if (!data) {
    throw new Error('Person was not returned after delete.');
  }
}
