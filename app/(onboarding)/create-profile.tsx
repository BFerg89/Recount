import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type TextInput } from 'react-native';

import { router } from 'expo-router';
import { createProfile } from '@/lib/profilesApi';

import { AuthTextInput } from '@/components/auth/AuthTextInput';
import { nightLogTheme } from '@/constants/NightLogTheme';

const { colors, fonts, layout, radius, shadows, spacing, type } = nightLogTheme;

export default function CreateProfileScreen() {
  const [username, setUsername] = useState('');
  const [nickname, setNickname] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const nicknameInputRef = useRef<TextInput>(null);

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
      return true;
    }

    setProfileError(null);
    setIsSubmitting(true);

    try {
      await createProfile({ username, nickname });
      router.replace('/(tabs)');
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Could not create profile.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.formArea}>
          <AuthTextInput
            value={username}
            onChangeText={setUsername}
            autoCapitalize='none'
            autoCorrect={false}
            autoComplete='username'
            textContentType='username'
            placeholder='Username...'
            returnKeyType='next'
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
            onSubmitEditing={handleCreateProfile}
          />
          {(formError || profileError) && (
            <Text style={styles.errorText}>{formError ?? profileError}</Text>
          )}
          <Pressable
            accessibilityState={{ disabled: !hasRequiredFields || isSubmitting }}
            onPress={handleCreateProfile}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && hasRequiredFields && styles.primaryButtonPressed,
              !hasRequiredFields && styles.primaryButtonDisabled,
            ]}
          >
            <Text style={styles.primaryButtonText}>Create Profile</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.paper,
    paddingHorizontal: layout.mobileGutter,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: spacing.s7,
  },
  formArea: {
    flex: 1,
    gap: layout.verticalCardGap,
    justifyContent: 'center',
  },
  primaryButton: {
    minHeight: 50,
    borderRadius: radius.pill,
    backgroundColor: colors.terracotta,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.s2,
    paddingHorizontal: spacing.s4,
  },
  primaryButtonPressed: {
    backgroundColor: colors.terracottaDeep,
    boxShadow: shadows.press,
    transform: [{ scale: 0.98 }],
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    fontFamily: fonts.bodyStrong,
    fontSize: type.body.fontSize,
    lineHeight: type.body.lineHeight,
    color: colors.paperCard,
  },
  errorText: {
    fontFamily: fonts.body,
    fontSize: type.bodyS.fontSize,
    lineHeight: type.bodyS.lineHeight,
    color: colors.terracottaDeep,
  },
});
