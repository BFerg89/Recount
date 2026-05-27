import { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';
import { isAuthError, isAuthWeakPasswordError } from '@supabase/supabase-js';

import { AuthFormScreen } from '@/components/auth/AuthFormScreen';
import { AuthTextInput } from '@/components/auth/AuthTextInput';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { recountTheme } from '@/constants/RecountTheme';
import { useAuth } from '@/context/AuthContext';

const { colors, fonts, type } = recountTheme;
const minimumPasswordLength = 6;

const getSignUpErrorMessage = (error: unknown) => {
  if (isAuthWeakPasswordError(error)) {
    return `Password must be at least ${minimumPasswordLength} characters.`;
  }

  if (isAuthError(error)) {
    switch (error.code) {
      case 'email_exists':
      case 'user_already_exists':
        return 'An account with this email already exists. Log in instead.';
      case 'email_address_invalid':
      case 'validation_failed':
        return 'Enter a valid email address.';
      case 'signup_disabled':
        return 'Sign up is currently disabled.';
      case 'over_email_send_rate_limit':
      case 'over_request_rate_limit':
        return 'Too many sign up attempts. Wait a moment and try again.';
      default:
        return error.message || 'Could not create your account. Try again.';
    }
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return 'Could not create your account. Try again.';
};

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

  const clearStoredErrors = () => {
    setFormError(null);
    setAuthError(null);
  };

  const handleEmailChange = (nextEmail: string) => {
    setEmail(nextEmail);
    clearStoredErrors();
  };

  const handlePasswordChange = (nextPassword: string) => {
    setPassword(nextPassword);
    clearStoredErrors();
  };

  const handleConfirmPasswordChange = (nextConfirmPassword: string) => {
    setConfirmPassword(nextConfirmPassword);
    clearStoredErrors();
  };

  const handleSignUp = async () => {
    if (!hasRequiredFields) {
      setFormError('Fill in each field to create your account.');
      return;
    }

    if (passwordMismatch) {
      setFormError('Passwords do not match.');
      return;
    }

    if (password.length < minimumPasswordLength) {
      setFormError(`Password must be at least ${minimumPasswordLength} characters.`);
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
    } catch (error) {
      setAuthError(getSignUpErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthFormScreen
      footer={(
        <Pressable
          onPress={() => router.replace('/login')}
          style={styles.loginButton}
        >
          {({ pressed }) => (
            <>
              <Text style={pressed ? styles.loginTextPressed : styles.loginText}>
                Already have Recount?
              </Text>
              <Text style={pressed ? styles.loginTextPressed : styles.loginText}>
                Login
              </Text>
            </>
          )}
        </Pressable>
      )}>
      <AuthTextInput
        value={email}
        onChangeText={handleEmailChange}
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
        onChangeText={handlePasswordChange}
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
        onChangeText={handleConfirmPasswordChange}
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
      <PrimaryButton
        label="Create Account"
        disabled={!canSubmit || isSubmitting}
        onPress={handleSignUp}
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
