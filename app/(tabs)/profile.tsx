import { Text, View, Pressable, StyleSheet } from 'react-native';
import { nightLogTheme } from '@/constants/NightLogTheme';
import { useAuth } from '@/context/AuthContext';
const { colors, fonts, layout, radius, shadows, spacing, type } = nightLogTheme;

export default function ProfileScreen() {
  const { signOut } = useAuth();

  const handleSignout = async () => {
    try {
      await signOut();
    } catch {
      console.log('Could not sign out.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <Pressable onPress={handleSignout} style={styles.primaryButton}>
        <Text style={styles.primaryButtonText}>Sign Out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  primaryButtonText: {
    fontFamily: fonts.bodyStrong,
    fontSize: type.body.fontSize,
    lineHeight: type.body.lineHeight,
    color: colors.paperCard,
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
});
