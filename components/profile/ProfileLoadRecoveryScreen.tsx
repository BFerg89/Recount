import { Alert, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { recountTheme } from '@/constants/RecountTheme';
import { useAuth } from '@/context/AuthContext';
import { useProfile } from '@/context/ProfileContext';

const { colors, layout, shadows, spacing, type } = recountTheme;

export default function ProfileLoadRecoveryScreen() {
  const insets = useSafeAreaInsets();
  const { clearLocalSession } = useAuth();
  const { refreshProfile, isLoading } = useProfile();

  const handleTryAgain = () => {
    void refreshProfile();
  };

  const handleSignOutPress = () => {
    Alert.alert(
      'Sign out?',
      "You'll need to log in again to access your logs on this device.",
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign out',
          style: 'destructive',
          onPress: () => {
            void clearLocalSession();
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <View
      style={[
        styles.screen,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}>
      <View style={styles.content}>
        <View style={styles.copy}>
          <Text selectable style={styles.mainText}>We couldn't load your profile.</Text>
          <Text selectable style={styles.bodyText}>Check your connection.</Text>
        </View>

        <View style={styles.actions}>
          <PrimaryButton
            label={isLoading ? 'Trying again...' : 'Try Again'}
            disabled={isLoading}
            onPress={handleTryAgain}
          />
          <PrimaryButton
            label="Sign Out"
            onPress={handleSignOutPress}
            style={styles.secondaryButton}
            pressedStyle={styles.secondaryButtonPressed}
            textStyle={styles.secondaryButtonText}
          />
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
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s7,
  },
  copy: {
    maxWidth: 320,
    alignItems: 'center',
    gap: spacing.s2,
  },
  mainText: {
    fontFamily: type.displayS.fontFamily,
    fontSize: type.displayS.fontSize,
    lineHeight: type.displayS.lineHeight,
    letterSpacing: type.displayS.letterSpacing,
    color: colors.ink,
    textAlign: 'center',
  },
  bodyText: {
    fontFamily: type.body.fontFamily,
    fontSize: type.body.fontSize,
    lineHeight: type.body.lineHeight,
    color: colors.inkMid,
    textAlign: 'center',
  },
  actions: {
    width: '100%',
    maxWidth: 360,
    gap: layout.verticalCardGap,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.paperEdge,
    backgroundColor: colors.paperCard,
    boxShadow: shadows.card,
  },
  secondaryButtonPressed: {
    backgroundColor: colors.paperEdge,
    boxShadow: shadows.press,
  },
  secondaryButtonText: {
    color: colors.terracottaDeep,
  },
});
