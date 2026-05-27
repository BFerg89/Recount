import { useRef, useState } from 'react';
import { SymbolView } from 'expo-symbols';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { recountTheme } from '@/constants/RecountTheme';
import { useAuth } from '@/context/AuthContext';
import { useLogs } from '@/context/LogsContext';
import { useProfile } from '@/context/ProfileContext';
import { AddFriendSheet } from '@/components/profile/AddFriendSheet';

const { colors, fonts, layout, radius, shadows, spacing, type } = recountTheme;

type FriendPreview = {
  id: string;
  displayName: string;
  username: string;
  direction?: 'incoming' | 'outgoing';
};

type FriendRowProps = {
  friend: FriendPreview;
  index: number;
  isLast: boolean;
  statusLabel: string;
  statusVariant?: 'default' | 'request';
};

const friendPreviews: FriendPreview[] = [
  { id: 'friend-thea', displayName: 'Thea', username: 'thea' },
  { id: 'friend-finlay', displayName: 'Finlay', username: 'finlay' },
  { id: 'friend-georgia', displayName: 'Georgia', username: 'georgia' },
  { id: 'friend-india', displayName: 'India', username: 'india' },
  { id: 'friend-mac', displayName: 'Mac', username: 'mac' },
  { id: 'friend-juliana', displayName: 'Juliana', username: 'juliana' },
  { id: 'friend-isabella', displayName: 'Isabella', username: 'isabella' },
  { id: 'friend-rory', displayName: 'Rory', username: 'rory' },
  { id: 'friend-aurele', displayName: 'Aurele', username: 'aurele' },
];

const pendingFriendRequests: FriendPreview[] = [];

const getInitials = (displayName: string, fallback: string) => {
  const source = displayName.trim() || fallback.trim();
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return 'NL';
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
};

function FriendRow({
  friend,
  index,
  isLast,
  statusLabel,
  statusVariant = 'default',
}: FriendRowProps) {
  const isRequest = statusVariant === 'request';

  return (
    <View
      style={[
        styles.friendRow,
        isLast && styles.lastFriendRow,
      ]}>
      <View
        style={[
          styles.friendAvatar,
          {
            backgroundColor:
              colors.personTones[index % colors.personTones.length],
          },
        ]}>
        <Text style={styles.friendAvatarText}>
          {getInitials(friend.displayName, friend.username)}
        </Text>
      </View>

      <View style={styles.friendDetails}>
        <Text numberOfLines={1} style={styles.friendName}>
          {friend.displayName}
        </Text>
        <Text numberOfLines={1} style={styles.friendUsername}>
          @{friend.username}
        </Text>
      </View>

      <View style={isRequest ? styles.requestStatusPill : styles.friendStatusPill}>
        <Text style={isRequest ? styles.requestStatusText : styles.friendStatusText}>
          {statusLabel}
        </Text>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const { logs } = useLogs();

  const addFriendSheetRef = useRef<BottomSheet>(null);
  const insets = useSafeAreaInsets();
  const [friendUsername, setFriendUsername] = useState('');

  const username = profile?.username ?? 'username';
  const nickname = profile?.nickname ?? 'NightLog user';
  const profileInitials = getInitials(nickname, username);
  const useCompactNickname = nickname.length > 15;

  const handleSignout = async () => {
    try {
      await signOut();
    } catch {
      console.log('Could not sign out.');
    }
  };

  const handleAddFriend = () => {
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        style={styles.scrollView}
        contentContainerStyle={styles.content}>
        <View style={styles.titleSection}>
          <Text style={styles.titleText}>Profile</Text>

          <Pressable
            style={({ pressed }) => [
              styles.addFriendButton,
              pressed && styles.addFriendButtonPressed,
            ]}
            onPress={() => addFriendSheetRef.current?.expand()}>
            <SymbolView
              name={{
                ios: 'plus.circle.fill',
                android: 'add_circle',
              }}
              tintColor={colors.terracotta}
              size={18}
            />
            <Text style={styles.addFriendButtonText}>Add friend</Text>
          </Pressable>
        </View>

        <View style={styles.userCard}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>{profileInitials}</Text>
          </View>

          <View style={styles.userCardDetails}>
            <Text
              numberOfLines={1}
              style={[
                styles.nicknameText,
                useCompactNickname && styles.nicknameTextSmall,
              ]}>
              {nickname}
            </Text>
            <Text selectable numberOfLines={1} style={styles.usernameText}>
              @{username}
            </Text>
            {!!user?.email && (
              <Text selectable numberOfLines={1} style={styles.emailText}>
                {user.email}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{friendPreviews.length}</Text>
            <Text style={styles.statLabel}>Friends</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{pendingFriendRequests.length}</Text>
            <Text style={styles.statLabel}>Requests</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{logs.length}</Text>
            <Text style={styles.statLabel}>Logs</Text>
          </View>
        </View>

        <View style={styles.friendsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>Friend requests</Text>
          </View>

          {pendingFriendRequests.length > 0 ? (
            <View style={styles.friendsCard}>
              {pendingFriendRequests.map((request, index) => (
                <FriendRow
                  key={request.id}
                  friend={request}
                  index={index}
                  isLast={index === pendingFriendRequests.length - 1}
                  statusLabel={request.direction === 'outgoing' ? 'Sent' : 'Incoming'}
                  statusVariant="request"
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyRequestsCard}>
              <View style={styles.emptyRequestsIcon}>
                <SymbolView
                  name={{
                    ios: 'person.2',
                    android: 'group',
                  }}
                  tintColor={colors.inkSoft}
                  size={23}
                />
              </View>
              <View style={styles.emptyRequestsCopy}>
                <Text style={styles.emptyRequestsTitle}>No pending requests</Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.friendsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>Friends</Text>
          </View>

          <View style={styles.friendsCard}>
            {friendPreviews.map((friend, index) => (
              <FriendRow
                key={friend.id}
                friend={friend}
                index={index}
                isLast={index === friendPreviews.length - 1}
                statusLabel="Friend"
              />
            ))}
          </View>
        </View>

        <View style={styles.accountSection}>
          <Text style={styles.sectionLabel}>Account</Text>
          <Pressable
            style={({ pressed }) => [
              styles.signOutButton,
              pressed && styles.signOutButtonPressed,
            ]}
            onPress={handleSignout}>
            <Text style={styles.signOutButtonText}>Sign out</Text>
          </Pressable>
        </View>
      </ScrollView>

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
    paddingTop: layout.statusBarSpace,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: layout.mobileGutter,
    gap: layout.sectionSpacing,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.s4,
  },
  titleText: {
    fontFamily: fonts.display,
    fontSize: type.displayXl.fontSize,
    letterSpacing: type.displayXl.letterSpacing,
    color: colors.terracotta,
  },
  addFriendButton: {
    minHeight: 44,
    paddingHorizontal: spacing.s3,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.terracottaSoft,
    backgroundColor: colors.paperCard,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s1,
    boxShadow: shadows.card,
  },
  addFriendButtonPressed: {
    backgroundColor: colors.paperEdge,
    boxShadow: shadows.press,
    transform: [{ scale: 0.98 }],
  },
  addFriendButtonText: {
    fontFamily: fonts.bodyStrong,
    fontSize: type.bodyS.fontSize,
    lineHeight: type.bodyS.lineHeight,
    color: colors.terracotta,
  },
  userCard: {
    padding: layout.cardPadding,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s4,
    backgroundColor: colors.paperCard,
    borderColor: colors.paperEdge,
    borderWidth: 1,
    borderRadius: radius.l,
    boxShadow: shadows.card,
  },
  profileAvatar: {
    width: 78,
    height: 78,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.terracottaSoft,
    borderWidth: 1,
    borderColor: colors.paperEdge,
  },
  profileAvatarText: {
    fontFamily: fonts.display,
    fontSize: type.displayS.fontSize,
    lineHeight: type.displayS.lineHeight,
    letterSpacing: type.displayS.letterSpacing,
    color: colors.terracottaDeep,
  },
  userCardDetails: {
    flex: 1,
    minWidth: 0,
    gap: spacing.s1,
  },
  nicknameText: {
    fontFamily: fonts.display,
    fontSize: type.displayM.fontSize,
    lineHeight: type.displayM.lineHeight,
    letterSpacing: type.displayM.letterSpacing,
    color: colors.ink,
  },
  nicknameTextSmall: {
    fontSize: type.displayS.fontSize,
    lineHeight: type.displayS.lineHeight,
    letterSpacing: type.displayS.letterSpacing,
  },
  usernameText: {
    fontFamily: fonts.bodyStrong,
    fontSize: type.body.fontSize,
    lineHeight: type.body.lineHeight,
    color: colors.inkMid,
  },
  emailText: {
    fontFamily: fonts.body,
    fontSize: type.bodyS.fontSize,
    lineHeight: type.bodyS.lineHeight,
    color: colors.inkSoft,
  },
  statsCard: {
    minHeight: 94,
    padding: layout.cardPadding,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radius.l,
    borderWidth: 1,
    borderColor: colors.paperEdge,
    backgroundColor: colors.paperCard,
    boxShadow: shadows.card,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.s1,
  },
  statNumber: {
    fontFamily: fonts.display,
    fontSize: type.displayM.fontSize,
    lineHeight: type.displayM.lineHeight,
    letterSpacing: type.displayM.letterSpacing,
    fontVariant: ['tabular-nums'],
    color: colors.ink,
  },
  statLabel: {
    fontFamily: fonts.label,
    fontSize: type.micro.fontSize,
    lineHeight: type.micro.lineHeight,
    letterSpacing: type.micro.letterSpacing,
    textTransform: type.micro.textTransform,
    color: colors.inkMid,
  },
  statDivider: {
    width: 1,
    height: 44,
    backgroundColor: colors.rule,
  },
  friendsSection: {
    gap: spacing.s3,
  },
  sectionHeader: {
    minHeight: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.s3,
  },
  sectionLabel: {
    fontFamily: fonts.label,
    fontSize: type.label.fontSize,
    lineHeight: type.label.lineHeight,
    letterSpacing: type.label.letterSpacing,
    textTransform: type.label.textTransform,
    color: colors.inkMid,
  },
  friendsCard: {
    backgroundColor: colors.paperCard,
    borderWidth: 1,
    borderColor: colors.paperEdge,
    borderRadius: radius.l,
    overflow: 'hidden',
    boxShadow: shadows.card,
  },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s3,
    borderBottomWidth: 1,
    borderBottomColor: colors.rule,
    paddingVertical: spacing.s3,
    paddingHorizontal: layout.cardPadding,
  },
  lastFriendRow: {
    borderBottomWidth: 0,
  },
  friendAvatar: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.paperEdge,
  },
  friendAvatarText: {
    fontFamily: fonts.bodyStrong,
    fontSize: type.bodyS.fontSize,
    lineHeight: type.bodyS.lineHeight,
    color: colors.paperCard,
  },
  friendDetails: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  friendName: {
    fontFamily: fonts.bodyStrong,
    fontSize: type.body.fontSize,
    color: colors.ink,
  },
  friendUsername: {
    fontFamily: fonts.body,
    fontSize: type.bodyS.fontSize,
    lineHeight: type.bodyS.lineHeight,
    color: colors.inkSoft,
  },
  friendStatusPill: {
    minHeight: 30,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.paperEdge,
    paddingHorizontal: spacing.s3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.paper,
  },
  friendStatusText: {
    fontFamily: fonts.label,
    fontSize: type.micro.fontSize,
    lineHeight: type.micro.lineHeight,
    letterSpacing: type.micro.letterSpacing,
    textTransform: type.micro.textTransform,
    color: colors.inkMid,
  },
  requestStatusPill: {
    minHeight: 30,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.terracottaSoft,
    paddingHorizontal: spacing.s3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.paper,
  },
  requestStatusText: {
    fontFamily: fonts.label,
    fontSize: type.micro.fontSize,
    lineHeight: type.micro.lineHeight,
    letterSpacing: type.micro.letterSpacing,
    textTransform: type.micro.textTransform,
    color: colors.terracottaDeep,
  },
  emptyRequestsCard: {
    minHeight: 96,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s3,
    borderRadius: radius.l,
    borderWidth: 1,
    borderColor: colors.paperEdge,
    backgroundColor: colors.paperCard,
    padding: layout.cardPadding,
    boxShadow: shadows.card,
  },
  emptyRequestsIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.paperEdge,
  },
  emptyRequestsCopy: {
    flex: 1,
    minWidth: 0,
    gap: spacing.s1,
  },
  emptyRequestsTitle: {
    fontFamily: fonts.bodyStrong,
    fontSize: type.body.fontSize,
    lineHeight: type.body.lineHeight,
    color: colors.ink,
  },
  accountSection: {
    gap: spacing.s2,
  },
  signOutButton: {
    minHeight: 48,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.rule,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.paperCard,
    boxShadow: shadows.card,
  },
  signOutButtonPressed: {
    backgroundColor: colors.paperEdge,
    boxShadow: shadows.press,
    transform: [{ scale: 0.99 }],
  },
  signOutButtonText: {
    fontFamily: fonts.bodyStrong,
    fontSize: type.body.fontSize,
    lineHeight: type.body.lineHeight,
    color: colors.terracottaDeep,
  },
});
