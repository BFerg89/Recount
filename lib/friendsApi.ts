import { supabase } from '@/lib/supabase';

export type Friendship = {
  id: string;
  status: 'pending' | 'accepted';
  direction: 'incoming' | 'outgoing';
  otherProfile: {
    id: string;
    username: string;
    nickname: string;
  };
  createdAt: string;
  updatedAt: string;
};

type FriendshipRow = {
  friendship_id: string;
  status: Friendship['status'];
  direction: Friendship['direction'];
  other_profile_id: string;
  other_username: string;
  other_nickname: string;
  created_at: string;
  updated_at: string;
};

const toError = (error: unknown, fallbackMessage = 'Unknown Friends API error.') => {
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

const mapFriendship = (row: FriendshipRow): Friendship => {
  return {
    id: row.friendship_id,
    status: row.status,
    direction: row.direction,
    otherProfile: {
      id: row.other_profile_id,
      username: row.other_username,
      nickname: row.other_nickname,
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

export async function fetchFriendships(): Promise<Friendship[]> {
  const { data, error } = await supabase.rpc('list_friendships');

  if (error) {
    throw toError(error, 'Could not load friendships.');
  }

  const rows = (data ?? []) as FriendshipRow[];

  return rows.map(mapFriendship);
}