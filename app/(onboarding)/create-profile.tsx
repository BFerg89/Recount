import { useRef, useState } from 'react';
import { StyleSheet, Text, type TextInput } from 'react-native';

import { router } from 'expo-router';
import { useProfile } from '@/context/ProfileContext';
import { createProfile } from '@/features/profile/profilesApi';

import { AuthFormScreen } from '@/components/auth/AuthFormScreen';
import { AuthTextInput } from '@/components/auth/AuthTextInput';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { inputLimits } from '@/constants/input-limits';
import { recountTheme } from '@/constants/RecountTheme';

const { colors, fonts, type } = recountTheme;

export default function CreateProfileScreen() {
  const [username, setUsername] = useState('');
  const [nickname, setNickname] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const nicknameInputRef = useRef<TextInput>(null);
  const { setCurrentProfile } = useProfile();

  const hasRequiredFields = (
    username.trim().length > 0 &&
    nickname.trim().length > 0
  );

  const handleCreateProfile = async () => {
    if (!hasRequiredFields) {
      setFormError('Fill in each field to create your profile.');
      return;
    }

    setFormError(null);

    if (isSubmitting) {
      return;
    }

    setProfileError(null);
    setIsSubmitting(true);

    try {
      const createdProfile = await createProfile({ username, nickname });
      setCurrentProfile(createdProfile);
      router.replace('/(tabs)');
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Could not create profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthFormScreen>
      <AuthTextInput
        prefix="@"
        value={username}
        onChangeText={setUsername}
        autoCapitalize='none'
        autoCorrect={false}
        autoComplete='username'
        textContentType='username'
        placeholder='Username...'
        returnKeyType='next'
        maxLength={inputLimits.username}
        onSubmitEditing={() => nicknameInputRef.current?.focus()}
      />
      <AuthTextInput
        ref={nicknameInputRef}
        value={nickname}
        onChangeText={setNickname}
        autoCapitalize='words'
        autoCorrect={false}
        placeholder='Nickname...'
        returnKeyType='done'
        maxLength={inputLimits.nickname}
        onSubmitEditing={handleCreateProfile}
      />
      {(formError || profileError) && (
        <Text style={styles.errorText}>{formError ?? profileError}</Text>
      )}
      <PrimaryButton
        label="Create Profile"
        disabled={!hasRequiredFields || isSubmitting}
        onPress={handleCreateProfile}
      />
    </AuthFormScreen>
  );
}

const styles = StyleSheet.create({
  errorText: {
    fontFamily: fonts.body,
    fontSize: type.bodyS.fontSize,
    lineHeight: type.bodyS.lineHeight,
    color: colors.terracottaDeep,
  },
});
