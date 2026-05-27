import { Text, View, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useRef, useState } from 'react';
import { SymbolView } from 'expo-symbols';
import { recountTheme } from '@/constants/RecountTheme';
import { useAuth } from '@/context/AuthContext';
import { useProfile } from '@/context/ProfileContext';
import { AddFriendSheet } from '@/components/profile/AddFriendSheet';
import BottomSheet from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
const { colors, fonts, layout, radius, shadows, spacing, type } = recountTheme;

export default function ProfileScreen() {
  const { user, signOut } = useAuth();

  const { profile } = useProfile();
  const username = profile?.username ?? 'No username found';
  const nickname = profile?.nickname ?? 'No nickname found'
  const useSmallNickname = nickname.length > 11;

  const addFriendSheetRef = useRef<BottomSheet>(null);
  const insets = useSafeAreaInsets();
  const [friendUsername, setFriendUsername] = useState('');

  const friends = ['Thea', 'Finlay', 'Georgia', 'India', 'Mac', 'Juliana', 'Isabella', 'Rory', 'Aurele']; //Placeholder

  const handleSignout = async () => {
    try {
      await signOut();
    } catch {
      console.log('Could not sign out.');
    }
  };

  const handleAddFriend = () => {

  }

  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.titleSection}>
          <Text style={styles.titleText}>Profile</Text>
          <Pressable 
            style={styles.addFriendsButton}
            onPress={() => addFriendSheetRef.current?.expand()}
          >
            <SymbolView
              name={{
                ios: 'plus',
                android: 'add',
              }}
              tintColor={colors.terracotta}
              size={20}/>
            <Text style={styles.addFriendsButton}>Add Friends</Text>
          </Pressable>
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
                styles.nicknameText,
                useSmallNickname && styles.nicknameTextSmall,
              ]}
            >{nickname}</Text>
            <Text style={styles.usernameText}>@{username}</Text>
          </View>
        </View>
        <View style={styles.friendsSection}>
          <Text style={styles.friendsLabel}>Friends · 20</Text>
          <ScrollView style={styles.friendsCard}>
            {friends.map((friend) => (
              <View 
                key={friend}
                style={styles.friendRow}
              >
                <SymbolView name={{
                  ios: 'person.circle',
                  android: 'person',
                }}
                size={40}/>
                <View>
                  <Text style={styles.friendName}>{friend}</Text>
                  <Text>@{friend}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
        <View style={styles.actionSection}>
          <Pressable style={styles.button}>
            <Text style={styles.buttonText}>*Edit Profile*</Text>
          </Pressable>
          <Pressable 
          style={[styles.button, {
            borderColor: 'red', borderWidth: 0.5, borderStyle: 'dashed'
            }]}
          onPress={handleSignout}>
            <Text style={styles.buttonText}>Sign Out</Text>
          </Pressable>
        </View>
      </View>

      <AddFriendSheet
        sheetRef={addFriendSheetRef}
        bottomInset={insets.bottom}
        friendUsername={friendUsername}
        onChangeFriendUsername={(username) => {
          setFriendUsername(username);
        }}
        onAddFriend={handleAddFriend}
        />
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
    gap: spacing.s1,
  },
  friendsSection: {
    flex: 1,
    gap: spacing.s3,
  },
  friendsCard: {
    backgroundColor: colors.paperCard,
    borderWidth: 1,
    borderColor: colors.paperEdge,
    borderRadius: radius.xl,
    padding: layout.cardPadding,
    boxShadow: shadows.card,
  },
  friendsLabel: {
    fontFamily: fonts.label,
    fontSize: type.label.fontSize,
    lineHeight: type.label.lineHeight,
    letterSpacing: type.label.letterSpacing,
    textTransform: type.label.textTransform,
    color: colors.inkMid,
  },
  friendRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.rule,
    paddingVertical: spacing.s1,
    alignItems: 'center',
    paddingHorizontal: spacing.s1,
    gap: spacing.s2,
  },
  friendName: {
    fontFamily: fonts.bodyStrong,
    fontSize: type.body.fontSize,

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
    boxShadow: shadows.card,
  },
  userCardDetails: {
    width: '100%'
  },
  nicknameText: {
    fontFamily: fonts.bodyStrong,
    fontSize: type.displayM.fontSize,
    lineHeight: type.displayM.lineHeight,
    letterSpacing: type.displayM.letterSpacing,
    color: colors.ink,
  },
  nicknameTextSmall: {
    fontFamily: fonts.bodyStrong,
    fontSize: type.displayS.fontSize,
    lineHeight: type.displayS.lineHeight,
    letterSpacing: type.displayS.letterSpacing,
    color: colors.ink,
  },
  usernameText: {
    fontFamily: fonts.label,
    fontSize: type.label.fontSize,
    lineHeight: type.label.lineHeight,
    letterSpacing: type.label.letterSpacing,
    color: colors.inkMid,
  },
  actionSection: {
    flexDirection: 'row',
    gap: spacing.s3,
  },
  button: {
    flex: 1,
    minHeight: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s2,
    boxShadow: shadows.card,
  },
  buttonText: {
    fontFamily: fonts.label,
    fontSize: type.body.fontSize,
    textTransform: type.label.textTransform,
    color: colors.inkMid,
  },
});
