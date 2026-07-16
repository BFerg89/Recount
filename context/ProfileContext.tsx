import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';

import { useAuth } from '@/context/AuthContext';
import { fetchCurrentProfile } from '@/features/profile/profilesApi';
import type { UserProfile } from '@/features/profile/profileTypes';

type ProfileContextValue = {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  refreshProfile: () => Promise<UserProfile | null>;
  setCurrentProfile: (profile: UserProfile) => void;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: PropsWithChildren) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const userId = user?.id ?? null;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshProfile = useCallback(async () => {
    if (isAuthLoading) {
      setIsLoading(true);
      return null;
    }

    if (!userId) {
      setProfile(null);
      setError(null);
      setIsLoading(false);
      return null;
    }

    setIsLoading(true);

    try {
      const fetchedProfile = await fetchCurrentProfile();
      setError(null);
      setProfile(fetchedProfile);
      return fetchedProfile;
    } catch (caughtError) {
      const message = caughtError instanceof Error
        ? caughtError.message
        : 'Unable to load profile.';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isAuthLoading, userId]);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const setCurrentProfile = useCallback((nextProfile: UserProfile) => {
    setProfile(nextProfile);
    setError(null);
  }, []);

  const value = useMemo<ProfileContextValue>(() => {
    return {
      profile,
      isLoading,
      error,
      refreshProfile,
      setCurrentProfile,
    };
  }, [profile, isLoading, error, refreshProfile, setCurrentProfile]);

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);

  if (!context) {
    throw new Error('useProfile must be used inside ProfileProvider');
  }

  return context;
}
