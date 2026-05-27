import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, type TextInput } from 'react-native';
import { router } from 'expo-router';
import { AuthFormScreen } from '@/components/auth/AuthFormScreen';
import { AuthTextInput } from '@/components/auth/AuthTextInput';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { recountTheme } from '@/constants/RecountTheme';
import { useAuth } from '@/context/AuthContext';

const { colors, fonts, type } = recountTheme;

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const passwordInputRef = useRef<TextInput>(null);

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
    <AuthFormScreen
      footer={(
        <Pressable
          style={styles.signUpButton}
          onPress={() => router.replace('/sign-up')}
        >
          {({ pressed }) => (
            <>
              <Text style={pressed ? styles.signUpTextPressed : styles.signUpText}>
                New to Recount?
              </Text>
              <Text style={pressed ? styles.signUpTextPressed : styles.signUpText}>
                Sign Up
              </Text>
            </>
          )}
        </Pressable>
      )}>
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
        onSubmitEditing={() => passwordInputRef.current?.focus()}
      />
      <AuthTextInput
        ref={passwordInputRef}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize='none'
        autoCorrect={false}
        autoComplete='password'
        textContentType='password'
        placeholder='Password...'
        returnKeyType='done'
        onSubmitEditing={handleLogin}
      />
      {authError && (
        <Text style={styles.errorText}>{authError}</Text>
      )}
      <PrimaryButton
        label={isSubmitting ? 'Logging in...' : 'Login'}
        disabled={!canSubmit || isSubmitting}
        onPress={handleLogin}
      />
    </AuthFormScreen>
  )
}

const styles = StyleSheet.create({
  errorText: {
    fontFamily: fonts.body,
    fontSize: type.bodyS.fontSize,
    lineHeight: type.bodyS.lineHeight,
    color: colors.terracottaDeep,
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
