import { supabase } from '@/lib/supabase';

export type UserProfile = {
  id: string;
  username: string;
  nickname: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateProfileInput = {
  username: string;
  nickname: string;
};

type ProfileRow = {
  id: string;
  username: string;
  nickname: string;
  created_at: string;
  updated_at: string;
};

const toError = (error: unknown, fallbackMessage = 'Unknown Profile API error.') => {
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

const mapProfile = (row: ProfileRow): UserProfile => ({
  id: row.id,
  username: row.username,
  nickname: row.nickname,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export async function createProfile(input: CreateProfileInput): Promise<UserProfile> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    throw toError(sessionError);
  }

  if (!sessionData.session) {
    throw new Error('You must be signed in to create a profile.');
  }

  const username = input.username.trim().toLowerCase();
  const nickname = input.nickname.trim();

  if (!/^[a-z0-9_]{3,24}$/.test(username)) {
    throw new Error('Username must be 3-24 characters and use only letters, numbers, and underscores');
  }

  if (nickname.length < 1 || nickname.length > 40) {
    throw new Error('Nickname must be 1-40 characters.');
  }

  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .insert({
      username,
      nickname,
    })
    .select('id, username, nickname, created_at, updated_at')
    .single();

  if (profileError) {
    // TODO: Translate duplicate username errors into a friendly "Username is already taken" message.
    throw toError(profileError, 'Could not create profile.');
  }

  if (!profileData) {
    throw new Error('Profile was not returned after creation');
  }

  return mapProfile(profileData as ProfileRow);
}

export async function fetchCurrentProfile(): Promise<UserProfile | null> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    throw toError(sessionError);
  }

  if (!sessionData.session) {
    throw new Error('You must be signed in to load a profile.');
  }

  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('id, username, nickname, created_at, updated_at')
    .eq('id', sessionData.session.user.id)
    .maybeSingle();

  if (profileError) {
    throw toError(profileError, 'Could not load profile.');
  }

  if (!profileData) {
    return null;
  }

  return mapProfile(profileData as ProfileRow);
}
