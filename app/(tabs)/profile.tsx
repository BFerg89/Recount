import { Text, View, Pressable, StyleSheet } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { nightLogTheme } from '@/constants/NightLogTheme';
import { useAuth } from '@/context/AuthContext';
const { colors, fonts, layout, radius, shadows, spacing, type } = nightLogTheme;

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const email = user?.email ?? 'No email found';

  const username = 'Bennett'; //Placeholder
  const useSmallUsername = username.length > 11;

  const handleSignout = async () => {
    try {
      await signOut();
    } catch {
      console.log('Could not sign out.');
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.titleSection}>
          <Text style={styles.titleText}>Profile</Text>
          <Pressable style={styles.addFriendsButton}>
            <SymbolView
              name={{
                ios: 'plus',
                android: 'add',
              }}
              tintColor={colors.terracotta}/>
            <Text style={styles.addFriendsButton}>Add Friends</Text>
          </Pressable>
        </View>
        <View style={styles.friendsSection}>
          <Text style={styles.friendsLabel}>Friends · 20</Text>
          <View style={styles.friendsCard}>
            
          </View>
        </View>
        <View style={styles.userCard}>
          <SymbolView name={{
            ios: 'person.circle',
            android: 'person',
          }}
          size={72}/>
          <View style={styles.userCardDetails}>
            <Text
              numberOfLines={1}
              style={[
                styles.usernameText,
                useSmallUsername && styles.usernameTextSmall,
              ]}
            >{username}</Text>
            <Text style={styles.emailText}>{email}</Text>
          </View>
        </View>
        </View>
      </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  content: {
    flex: 1,
    paddingTop: layout.statusBarSpace,
    paddingHorizontal: layout.mobileGutter,
    paddingBottom: layout.sectionSpacing,
    gap: layout.sectionSpacing,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  titleText: {
    fontFamily: fonts.display,
    fontSize: type.displayXl.fontSize,
    letterSpacing: type.displayXl.letterSpacing,
    color: colors.ink,
  },
  addFriendsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    color: colors.terracotta,
    fontFamily: fonts.bodyStrong,
    fontSize: type.bodyL.fontSize,
    gap: spacing.s2,
  },
  friendsSection: {
    flex: 1,
    gap: spacing.s3,
  },
  friendsCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.xl,
    borderColor: colors.paperEdge,
    backgroundColor: colors.paperCard,
  },
  friendsLabel: {
    fontFamily: fonts.label,
    fontSize: type.label.fontSize,
    lineHeight: type.label.lineHeight,
    letterSpacing: type.label.letterSpacing,
    textTransform: type.label.textTransform,
    color: colors.inkMid,
  },
  userCard: {
    padding: layout.cardPadding,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s4,
    backgroundColor: colors.paperCard,
    borderColor: colors.paperEdge,
    borderWidth: 1,
    borderRadius: radius.xl,
  },
  userCardDetails: {
    width: '100%'
  },
  usernameText: {
    fontFamily: fonts.bodyStrong,
    fontSize: type.displayM.fontSize,
    lineHeight: type.displayM.lineHeight,
    letterSpacing: type.displayM.letterSpacing,
    color: colors.ink,
  },
  usernameTextSmall: {
    fontFamily: fonts.bodyStrong,
    fontSize: type.displayS.fontSize,
    lineHeight: type.displayS.lineHeight,
    letterSpacing: type.displayS.letterSpacing,
    color: colors.ink,
  },
  emailText: {
    fontFamily: fonts.label,
    fontSize: type.label.fontSize,
    lineHeight: type.label.lineHeight,
    letterSpacing: type.label.letterSpacing,
    textTransform: type.label.textTransform,
    color: colors.inkMid,
  }
});
