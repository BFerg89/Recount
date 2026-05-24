import { useState } from 'react';
import { StyleSheet, View, TextInput, Pressable, Text } from 'react-native';
import { router } from 'expo-router';
import { nightLogTheme } from '@/constants/NightLogTheme';
import { useAuth } from '@/context/AuthContext';

const { colors, fonts, layout, radius, shadows, spacing, type } = nightLogTheme;

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const { signIn } = useAuth();

  const canSubmit = (
    email.trim().length > 0 &&
    password.length > 0
  );

  const handleLogin = async () => {
    if (!canSubmit || isSubmitting) {
      return;
    }

    setAuthError(null);
    setIsSubmitting(true);

    try {
      await signIn(email, password);
    } catch {
      setAuthError('Could not log in. Check your details and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.formArea}>
          <TextInput
            value={email}
            onChangeText={setEmail}
            keyboardType='email-address'
            autoCapitalize='none'
            autoCorrect={false}
            autoComplete='email'
            textContentType='emailAddress'
            placeholder='Email...'
            placeholderTextColor={colors.inkSoft}
            returnKeyType='next'
            selectionColor={colors.terracotta}
            style={styles.textInput}
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize='none'
            autoCorrect={false}
            autoComplete='password'
            textContentType='password'
            placeholder='Password...'
            placeholderTextColor={colors.inkSoft}
            returnKeyType='done'
            onSubmitEditing={handleLogin}
            selectionColor={colors.terracotta}
            style={styles.textInput}
          />
          {authError && (
            <Text style={styles.errorText}>{authError}</Text>
          )}
          <Pressable
            disabled={!canSubmit || isSubmitting}
            accessibilityState={{ disabled: !canSubmit || isSubmitting }}
            onPress={handleLogin}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && canSubmit && !isSubmitting && styles.primaryButtonPressed,
              (!canSubmit || isSubmitting) && styles.primaryButtonDisabled,
            ]}
          >
            <Text style={styles.primaryButtonText}>
              {isSubmitting ? 'Logging in...' : 'Login'}
            </Text>
          </Pressable>
        </View>
        <Pressable
          style={styles.signUpButton}
          onPress={() => router.replace('/sign-up')}
        >
          {({ pressed }) => (
            <>
              <Text style={pressed ? styles.signUpTextPressed : styles.signUpText}>
                New to NightLog?
              </Text>
              <Text style={pressed ? styles.signUpTextPressed : styles.signUpText}>
                Sign Up
              </Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  )
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
  textInput: {
    minHeight: 52,
    borderRadius: radius.m,
    borderWidth: 1,
    borderColor: colors.paperEdge,
    backgroundColor: colors.paperCard,
    paddingHorizontal: spacing.s4,
    paddingVertical: spacing.s3,
    fontFamily: fonts.body,
    fontSize: type.bodyL.fontSize,
    lineHeight: type.bodyL.lineHeight,
    color: colors.ink,
  },
  errorText: {
    fontFamily: fonts.body,
    fontSize: type.bodyS.fontSize,
    lineHeight: type.bodyS.lineHeight,
    color: colors.terracottaDeep,
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
  signUpButton: {
    alignItems: 'center',
    alignSelf: 'center',
  },
  signUpText: {
    fontFamily: fonts.label,
    fontSize: type.label.fontSize,
    lineHeight: type.label.lineHeight,
    textTransform: type.label.textTransform,
    color: colors.inkMid,
  },
  signUpTextPressed: {
    fontFamily: fonts.label,
    fontSize: type.label.fontSize,
    lineHeight: type.label.lineHeight,
    textTransform: type.label.textTransform,
    color: colors.inkSoft,
  },
});
