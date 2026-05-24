import { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { nightLogTheme } from '@/constants/NightLogTheme';
import { useAuth } from '@/context/AuthContext';

const { colors, fonts, layout, radius, shadows, spacing, type } = nightLogTheme;

export default function SignUpScreen() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { signUp } = useAuth();

  const hasRequiredFields = (
    displayName.trim().length > 0 &&
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
        setSuccessMessage('Check you email to confirm your accout.');
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
          <TextInput
            value={displayName}
            onChangeText={setDisplayName}
            autoCapitalize='words'
            autoCorrect={false}
            autoComplete='name'
            textContentType='name'
            placeholder='Name...'
            placeholderTextColor={colors.inkSoft}
            returnKeyType='next'
            selectionColor={colors.terracotta}
            style={styles.textInput}
          />
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
            autoComplete='new-password'
            textContentType='newPassword'
            placeholder='Password...'
            placeholderTextColor={colors.inkSoft}
            returnKeyType='next'
            selectionColor={colors.terracotta}
            style={styles.textInput}
          />
          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoCapitalize='none'
            autoCorrect={false}
            autoComplete='new-password'
            textContentType='newPassword'
            placeholder='Confirm password...'
            placeholderTextColor={colors.inkSoft}
            returnKeyType='done'
            onSubmitEditing={handleSignUp}
            selectionColor={colors.terracotta}
            style={styles.textInput}
          />
          {(formError || passwordMismatch || authError) && (
            <Text style={styles.errorText}>
              {passwordMismatch ? 'Passwords do not match.' : formError ?? authError}
            </Text>
          )}
          {successMessage && (
            <Text style={styles.successText}>{successMessage}</Text>
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
            <Text style={styles.primaryButtonText}>Create account</Text>
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
  successText: {
    fontFamily: fonts.body,
    fontSize: type.bodyS.fontSize,
    lineHeight: type.bodyS.lineHeight,
    color: colors.inkMid,
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
