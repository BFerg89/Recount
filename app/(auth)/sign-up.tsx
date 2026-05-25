import { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthTextInput } from '@/components/auth/AuthTextInput';
import { nightLogTheme } from '@/constants/NightLogTheme';
import { useAuth } from '@/context/AuthContext';

const { colors, fonts, layout, radius, shadows, spacing, type } = nightLogTheme;

export default function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const { signUp } = useAuth();

  const hasRequiredFields = (
    email.trim().length > 0 &&
    password.length > 0 &&
    confirmPassword.length > 0
  );
  const passwordMismatch = confirmPassword.length > 0 && password !== confirmPassword;
  const canSubmit = hasRequiredFields && !passwordMismatch;

  const handleSignUp = async () => {
    if (!hasRequiredFields) {
      setFormError('Fill in each field to create your account.');
      return;
    }

    if (passwordMismatch) {
      setFormError('Passwords do not match.');
      return;
    }

    setFormError(null);

    if (isSubmitting) {
      return;
    }

    setAuthError(null);
    setIsSubmitting(true);

    try {
      const result = await signUp(email, password);
      if (result.needsEmailConfirmation) {
        router.replace('/confirm-email');
      }
    } catch {
      setAuthError('Sign up auth error'); //Too general, eventually email/username take etc.
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.formArea}>
          <AuthTextInput
            value={email}
            onChangeText={setEmail}
            keyboardType='email-address'
            autoCapitalize='none'
            autoCorrect={false}
            autoComplete='email'
            textContentType='emailAddress'
            placeholder='Email...'
            returnKeyType='next'
          />
          <AuthTextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize='none'
            autoCorrect={false}
            autoComplete='new-password'
            textContentType='newPassword'
            placeholder='Password...'
            returnKeyType='next'
          />
          <AuthTextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoCapitalize='none'
            autoCorrect={false}
            autoComplete='new-password'
            textContentType='newPassword'
            placeholder='Confirm password...'
            returnKeyType='done'
            onSubmitEditing={handleSignUp}
          />
          {(formError || passwordMismatch || authError) && (
            <Text style={styles.errorText}>
              {passwordMismatch ? 'Passwords do not match.' : formError ?? authError}
            </Text>
          )}
          <Pressable
            disabled={!canSubmit || isSubmitting}
            accessibilityState={{ disabled: !canSubmit || isSubmitting}}
            onPress={handleSignUp}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && canSubmit && !isSubmitting && styles.primaryButtonPressed,
              (!canSubmit || isSubmitting) && styles.primaryButtonDisabled,
            ]}
          >
            <Text style={styles.primaryButtonText}>Create Account</Text>
          </Pressable>
        </View>
        <Pressable
          onPress={() => router.replace('/login')}
          style={styles.loginButton}
        >
          {({ pressed }) => (
            <>
              <Text style={pressed ? styles.loginTextPressed : styles.loginText}>
                Already have NightLog?
              </Text>
              <Text style={pressed ? styles.loginTextPressed : styles.loginText}>
                Login
              </Text>
            </>
          )}
        </Pressable>
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
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingBottom: spacing.s7,
  },
  formArea: {
    flex: 1,
    gap: layout.verticalCardGap,
    justifyContent: 'center',
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
  loginButton: {
    alignItems: 'center',
    alignSelf: 'center',
  },
  loginText: {
    fontFamily: fonts.label,
    fontSize: type.label.fontSize,
    lineHeight: type.label.lineHeight,
    textTransform: type.label.textTransform,
    color: colors.inkMid,
  },
  loginTextPressed: {
    fontFamily: fonts.label,
    fontSize: type.label.fontSize,
    lineHeight: type.label.lineHeight,
    textTransform: type.label.textTransform,
    color: colors.inkSoft,
  },
});
