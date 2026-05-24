import { promptedNoteDefinitions } from '@/data/promptedNotes';
import {
  formatDateForStorage,
  type CreateNightLogInput,
  type NightLogEntry,
  type NightLogNote,
  type NightPerson,
  type TimelineEvent,
} from '@/data/nightLogModels';
import { supabase } from '@/lib/supabase';

type NightLogRow = {
  id: string;
  creator_id: string | null;
  title: string;
  date: string;
  general_location: string;
  created_at: string;
  updated_at: string;
};

type NightPersonRow = {
  id: string;
  night_log_id: string;
  display_name: string;
  created_at: string;
  updated_at: string;
};

type TimelineEventRow = {
  id: string;
  night_log_id: string;
  title: string;
  approx_time: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

type NoteRow = {
  id: string;
  night_log_id: string;
  prompt_type: NightLogNote['promptType'];
  text: string;
  created_at: string;
  updated_at: string;
};

type NightLogWithChildrenRow = NightLogRow & {
  night_people: NightPersonRow[] | null;
  timeline_events: TimelineEventRow[] | null;
  notes: NoteRow[] | null;
};

const toError = (error: unknown, fallbackMessage = 'Unknown NightLog API error.') => {
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

const mapNightPerson = (row: NightPersonRow): NightPerson => {
  return {
    id: row.id,
    nightLogId: row.night_log_id,
    displayName: row.display_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

const mapTimelineEvent = (row: TimelineEventRow): TimelineEvent => {
  return {
    id: row.id,
    nightLogId: row.night_log_id,
    title: row.title,
    approxTime: row.approx_time,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

const mapNightLogNote = (row: NoteRow): NightLogNote => {
  return {
    id: row.id,
    nightLogId: row.night_log_id,
    promptType: row.prompt_type,
    text: row.text,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

const mapNightLog = (
  row: NightLogRow,
  people: NightPersonRow[],
  timelineEvents: TimelineEventRow[],
  notes: NoteRow[]
): NightLogEntry => {
  return {
    id: row.id,
    creatorId: row.creator_id,
    title: row.title,
    date: row.date,
    generalLocation: row.general_location,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    people: people.map(mapNightPerson),
    timelineEvents: timelineEvents
      .map(mapTimelineEvent)
      .sort((a, b) => a.sortOrder - b.sortOrder),
    notes: notes.map(mapNightLogNote),
  };
};

const rollbackCreatedNightLog = async (nightLogId: string) => {
  await supabase
    .from('night_logs')
    .delete()
    .eq('id', nightLogId);
};

export async function createNightLog(input: CreateNightLogInput): Promise<NightLogEntry> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    throw toError(sessionError);
  }

  if (!sessionData.session) {
    throw new Error('You must be signed in to create a NightLog.');
  }

  const { data: nightLogData, error: nightLogError } = await supabase
    .from('night_logs')
    .insert({
      title: input.title.trim(),
      date: formatDateForStorage(input.date),
      general_location: input.generalLocation.trim(),
    })
    .select('id, creator_id, title, date, general_location, created_at, updated_at')
    .single();

  if (nightLogError) {
    throw toError(nightLogError);
  }

  if (!nightLogData) {
    throw new Error('NightLog was not returned after creation.');
  }

  const nightLog = nightLogData as NightLogRow;

  try {
    const peoplePayload = input.people
      .map((person) => ({
        night_log_id: nightLog.id,
        display_name: person.displayName.trim(),
      }))
      .filter((person) => person.display_name.length > 0);

    const { data: peopleData, error: peopleError } = peoplePayload.length > 0
      ? await supabase
        .from('night_people')
        .insert(peoplePayload)
        .select('id, night_log_id, display_name, created_at, updated_at')
      : { data: [], error: null };

    if (peopleError) {
      throw toError(peopleError);
    }

    const timelineEventsPayload = input.moments
      .map((moment, index) => ({
        night_log_id: nightLog.id,
        title: moment.title.trim(),
        approx_time: moment.approxTime?.trim() || null,
        sort_order: index,
      }))
      .filter((moment) => moment.title.length > 0);

    const { data: timelineEventsData, error: timelineEventsError } = timelineEventsPayload.length > 0
      ? await supabase
        .from('timeline_events')
        .insert(timelineEventsPayload)
        .select('id, night_log_id, title, approx_time, sort_order, created_at, updated_at')
      : { data: [], error: null };

    if (timelineEventsError) {
      throw toError(timelineEventsError);
    }

    const notesPayload = promptedNoteDefinitions
      .map((prompt) => ({
        night_log_id: nightLog.id,
        prompt_type: prompt.promptType,
        text: (input.noteAnswers[prompt.promptType] ?? '').trim(),
      }))
      .filter((note) => note.text.length > 0);

    const { data: notesData, error: notesError } = notesPayload.length > 0
      ? await supabase
        .from('notes')
        .insert(notesPayload)
        .select('id, night_log_id, prompt_type, text, created_at, updated_at')
      : { data: [], error: null };

    if (notesError) {
      throw toError(notesError);
    }

    return mapNightLog(
      nightLog,
      peopleData as NightPersonRow[],
      timelineEventsData as TimelineEventRow[],
      notesData as NoteRow[]
    );
  } catch (error) {
    await rollbackCreatedNightLog(nightLog.id);
    throw error;
  }
}

export async function fetchNightLogs(): Promise<NightLogEntry[]> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    throw toError(sessionError);
  }

  if (!sessionData.session) {
    return [];
  }

  const { data, error } = await supabase
    .from('night_logs')
    .select(`
      id,
      creator_id,
      title,
      date,
      general_location,
      created_at,
      updated_at,
      night_people (
        id,
        night_log_id,
        display_name,
        created_at,
        updated_at
      ),
      timeline_events (
        id,
        night_log_id,
        title,
        approx_time,
        sort_order,
        created_at,
        updated_at
      ),
      notes (
        id,
        night_log_id,
        prompt_type,
        text,
        created_at,
        updated_at
      )
    `)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    throw toError(error);
  }

  const rows = (data ?? []) as NightLogWithChildrenRow[];

  return rows.map((row) => 
    mapNightLog(
      row,
      row.night_people ?? [],
      row.timeline_events ?? [],
      row.notes ?? []
    )
  );
}
