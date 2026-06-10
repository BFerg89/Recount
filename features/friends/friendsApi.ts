import { supabase } from '@/lib/supabase';

import type { FriendProfile, Friendship } from './friendTypes';

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

async function lookupProfileByUsername(inputUsername: string): Promise<FriendProfile | null> {
  const username = inputUsername.trim().toLowerCase();

  if (!/^[a-z0-9_]{3,24}$/.test(username)) {
    throw new Error('Invalid username.');
  }

  const { data, error } = await supabase.rpc('lookup_profile_by_username', { p_username: username });

  if (error) {
    throw toError(error, 'Could not look up user.');
  }

  const rows = (data ?? []) as FriendProfile[];

  return rows[0] ?? null;
}

export async function sendFriendRequest(username: string): Promise<void> {
  const targetProfile = await lookupProfileByUsername(username);

  if (targetProfile === null) {
    throw new Error('User not found.');
  }

  const { error: insertError } = await supabase
    .from('friendships')
    .insert({ addressee_id: targetProfile.id });

  if (insertError) {
    if (insertError.code === '23505') {
      throw new Error('Friend request already sent.');
    }

    if (insertError.code === '23514') {
      throw new Error('You cannot add yourself.');
    }

    throw toError(insertError, 'Could not send friend request.');
  }
}

export async function acceptFriendRequest(friendshipId: string): Promise<void> {
  const { data, error } = await supabase
    .from('friendships')
    .update({ status: 'accepted' })
    .eq('id', friendshipId)
    .select('id')
    .maybeSingle();

  if (error) {
    throw toError(error, 'Could not accept friend request.');
  }

  if (!data) {
    throw new Error('Friend request can no longer be accepted.');
  }
}

export async function deleteFriendship(friendshipId: string): Promise<void> {
  const { data, error } = await supabase
    .from('friendships')
    .delete()
    .eq('id', friendshipId)
    .select('id')
    .maybeSingle();

  if (error) {
    throw toError(error, 'Could not delete friendship.');
  }

  if (!data) {
    throw new Error('Friendship can no longer be changed.');
  }
}
