import { useCallback, useEffect, useRef, useState } from 'react';
import {
  HandshakeIcon,
  HourglassSimpleMediumIcon,
  TrashSimpleIcon,
  UserPlusIcon,
  UsersThreeIcon,
  WarningCircleIcon,
} from 'phosphor-react-native';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import BottomSheet from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { recountTheme } from '@/constants/RecountTheme';
import { useAuth } from '@/context/AuthContext';
import { useLogs } from '@/context/LogsContext';
import { useProfile } from '@/context/ProfileContext';
import { AddFriendSheet } from '@/components/profile/AddFriendSheet';
import { acceptFriendRequest, deleteFriendship, fetchFriendships, sendFriendRequest } from '@/features/friends/friendsApi';
import type { Friendship } from '@/features/friends/friendTypes';
import { deleteAccount } from '@/features/profile/profilesApi';

const { colors, fonts, layout, radius, shadows, spacing, type } = recountTheme;
const privacyPolicyUrl = 'https://getrecount.ca/privacy/';

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
  testID?: string;
  statusLabel?: string;
  statusVariant?: 'default' | 'request';
  actionLabel?: string;
  onActionPress?: () => void;
  isActionDisabled?: boolean;
  onDeletePress?: () => void;
  isDeleteDisabled?: boolean;
  deleteAccessibilityLabel?: string;
};

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
  testID,
  statusLabel,
  statusVariant = 'default',
  actionLabel,
  onActionPress,
  isActionDisabled,
  onDeletePress,
  isDeleteDisabled,
  deleteAccessibilityLabel,
}: FriendRowProps) {
  const isFriendRequest = statusVariant === 'request';

  const actionContent = statusLabel || actionLabel ? (
    <Text style={isFriendRequest ? styles.acceptButtonText : styles.friendStatusBadgeText}>
      {actionLabel ?? statusLabel}
    </Text>
  ) : null;

  const rowPrimaryAction = onActionPress ? (
    <Pressable
      testID={testID ? `${testID}-action-button` : undefined}
      accessibilityRole="button"
      accessibilityState={{ disabled: isActionDisabled === true }}
      disabled={isActionDisabled}
      onPress={onActionPress}
      style={({ pressed }) => [
        isFriendRequest ? styles.acceptButton : styles.friendStatusBadge,
        pressed && styles.acceptButtonPressed,
        isActionDisabled && styles.acceptButtonDisabled,
      ]}
    >
      {actionContent}
    </Pressable>
  ) : actionContent ? (
    <View style={isFriendRequest ? styles.acceptButton : styles.friendStatusBadge}>
      {actionContent}
    </View>
  ) : null;

  const deleteAction = onDeletePress ? (
    <Pressable
      testID={testID ? `${testID}-delete-button` : undefined}
      accessibilityLabel={deleteAccessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDeleteDisabled === true }}
      disabled={isDeleteDisabled}
      onPress={onDeletePress}
      style={({ pressed }) => [
        styles.deleteFriendButton,
        pressed && styles.deleteFriendButtonPressed,
        isDeleteDisabled && styles.deleteFriendButtonDisabled,
      ]}
    >
      <TrashSimpleIcon color={colors.paperCard} size={16} weight="bold" />
    </Pressable>
  ) : null;

  const rowActions = rowPrimaryAction || deleteAction ? (
    <View style={styles.friendRowActions}>
      {rowPrimaryAction}
      {deleteAction}
    </View>
  ) : null;

  return (
    <View
      testID={testID}
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

      {rowActions}
    </View>
  );
}

export default function ProfileScreen() {
  const { user, clearLocalSession, signOut } = useAuth();
  const { profile } = useProfile();
  const { logSummaries } = useLogs();

  const addFriendSheetRef = useRef<BottomSheet>(null);
  const isAddingFriendRef = useRef(false);
  const acceptingFriendshipIdRef = useRef<string | null>(null);
  const insets = useSafeAreaInsets();
  const [friendUsername, setFriendUsername] = useState('');
  const [addFriendError, setAddFriendError] = useState<string | null>(null);
  const [isAddingFriend, setIsAddingFriend] = useState(false);

  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [isFriendshipsLoading, setIsFriendshipsLoading] = useState(false);
  const [friendshipsError, setFriendshipsError] = useState<string | null>(null);
  const [friendshipActionError, setFriendshipActionError] = useState<string | null>(null);
  const [acceptingFriendshipId, setAcceptingFriendshipId] = useState<string | null>(null);
  const [deletingFriendshipId, setDeletingFriendshipId] = useState<string | null>(null);

  const username = profile?.username ?? 'username';
  const nickname = profile?.nickname ?? 'NightLog user';
  const profileInitials = getInitials(nickname, username);
  const useCompactNickname = nickname.length > 15;

  const friends = friendships.filter((friendship) => friendship.status === 'accepted');
  const incomingFriendRequests = friendships.filter(
    (friendship) => friendship.status === 'pending' && friendship.direction === 'incoming'
  );

  // TODO Friends v1 polish:
  // 1. Render outgoing requests and wire cancel action.
  const outgoingFriendRequests = friendships.filter(
    (friendship) => friendship.status === 'pending' && friendship.direction === 'outgoing'
  );

  const friendPreviews = friends.map((friendship) => ({
    id: friendship.id,
    displayName: friendship.otherProfile.nickname,
    username: friendship.otherProfile.username,
  }));

  const pendingFriendRequests = incomingFriendRequests.map((friendship) => ({
    id: friendship.id,
    displayName: friendship.otherProfile.nickname,
    username: friendship.otherProfile.username,
  }));

  const friendshipStatusMessage = isFriendshipsLoading
    ? 'Loading friends...'
    : friendshipsError
      ? 'Could not load friends'
      : null;
  const FriendshipStatusIcon = isFriendshipsLoading
    ? HourglassSimpleMediumIcon
    : WarningCircleIcon;
  const friendshipStatusIconTint = isFriendshipsLoading
    ? colors.inkSoft
    : colors.terracottaDeep;
  const isFriendshipStatusError = !isFriendshipsLoading && friendshipsError !== null;

  const refreshFriendships = useCallback(async () => {
    setIsFriendshipsLoading(true);
    setFriendshipsError(null);

    try {
      const fetchedFriendships = await fetchFriendships();
      setFriendships(fetchedFriendships);
    } catch (caughtError) {
      const message = caughtError instanceof Error
        ? caughtError.message
        : 'Unable to load friendships.';
      setFriendshipsError(message);
      setFriendships([]);
    } finally {
      setIsFriendshipsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshFriendships();
  }, [refreshFriendships]);

  const handleSignout = async () => {
    try {
      await signOut();
    } catch {
      console.log('Could not sign out.');
    }
  };

  const handleConfirmDeleteAccount = async () => {
    try {
      await deleteAccount();
      await clearLocalSession();
    } catch (caughtError) {
      const message = caughtError instanceof Error
        ? caughtError.message
        : 'Could not delete account.';

      Alert.alert('Could not delete account', message);
    }
  };

  const handleDeleteAccountPress = () => {
    Alert.alert(
      'Delete account?',
      'This permanently deletes your account and account data. This cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete account',
          style: 'destructive',
          onPress: handleConfirmDeleteAccount,
        },
      ],
      { cancelable: true }
    );
  };

  const handleOpenPrivacyPolicy = async () => {
    try {
      await WebBrowser.openBrowserAsync(privacyPolicyUrl);
    } catch {
      Alert.alert('Could not open privacy policy', `Visit ${privacyPolicyUrl} in your browser.`);
    }
  };

  const handleAddFriend = async () => {
    if (isAddingFriendRef.current) {
      return;
    }

    isAddingFriendRef.current = true;
    setAddFriendError(null);
    setIsAddingFriend(true);

    try {
      await sendFriendRequest(friendUsername);
      setFriendUsername('');
      addFriendSheetRef.current?.close();
      await refreshFriendships();
    } catch (caughtError) {
      const message = caughtError instanceof Error
        ? caughtError.message
        : 'Could not send friend request.';

      setAddFriendError(message);
    } finally {
      isAddingFriendRef.current = false;
      setIsAddingFriend(false);
    }
  };

  const handleAcceptFriendRequest = async (friendshipId: string) => {
    if (acceptingFriendshipIdRef.current === friendshipId || deletingFriendshipId === friendshipId) {
      return;
    }

    acceptingFriendshipIdRef.current = friendshipId;
    setFriendshipActionError(null);
    setAcceptingFriendshipId(friendshipId);

    try {
      await acceptFriendRequest(friendshipId);
      await refreshFriendships();
    } catch (caughtError) {
      const message = caughtError instanceof Error
        ? caughtError.message
        : 'Could not accept friend request.';

      setFriendshipActionError(message);
    } finally {
      if (acceptingFriendshipIdRef.current === friendshipId) {
        acceptingFriendshipIdRef.current = null;
        setAcceptingFriendshipId(null);
      }
    }
  };

  const handleDeleteFriend = async (friendshipId: string) => {
    setFriendshipActionError(null);
    setDeletingFriendshipId(friendshipId);

    try {
      await deleteFriendship(friendshipId);
      await refreshFriendships();
    } catch (caughtError) {
      const message = caughtError instanceof Error
        ? caughtError.message
        : 'Could not delete friendship.';

      setFriendshipActionError(message);
    } finally {
      setDeletingFriendshipId(null);
    }
  };

  return (
    <View testID="screen-profile" style={styles.screen}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        style={styles.scrollView}
        contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.titleText}>Profile</Text>

          <Pressable
            testID="profile-add-friend-button"
            style={({ pressed }) => [
              styles.addFriendButton,
              pressed && styles.addFriendButtonPressed,
            ]}
            onPress={() => addFriendSheetRef.current?.expand()}>
            <UserPlusIcon color={colors.terracotta} size={18} weight="bold" />
            <Text style={styles.addFriendButtonText}>Add friend</Text>
          </Pressable>
        </View>

        <View testID="profile-user-card" style={styles.userCard}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>{profileInitials}</Text>
          </View>

          <View style={styles.userCardDetails}>
            <Text
              testID="profile-nickname"
              numberOfLines={1}
              style={[
                styles.nicknameText,
                useCompactNickname && styles.nicknameTextSmall,
              ]}>
              {nickname}
            </Text>
            <Text testID="profile-username" selectable numberOfLines={1} style={styles.usernameText}>
              @{username}
            </Text>
            {!!user?.email && (
              <Text testID="profile-email" selectable numberOfLines={1} style={styles.emailText}>
                {user.email}
              </Text>
            )}
          </View>
        </View>

        <View testID="profile-stats-card" style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text testID="profile-friends-count" style={styles.statNumber}>{friendPreviews.length}</Text>
            <Text style={styles.statLabel}>Friends</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text testID="profile-requests-count" style={styles.statNumber}>{pendingFriendRequests.length}</Text>
            <Text style={styles.statLabel}>Requests</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text testID="profile-logs-count" style={styles.statNumber}>{logSummaries.length}</Text>
            <Text style={styles.statLabel}>Logs</Text>
          </View>
        </View>

        {friendshipStatusMessage ? (
          <View
            testID={isFriendshipStatusError ? 'profile-friends-error-state' : 'profile-friends-loading-state'}
            style={[
              styles.emptyStateCard,
              isFriendshipStatusError && styles.errorStateCard,
            ]}>
            <View
              style={[
                styles.emptyStateIcon,
                isFriendshipStatusError && styles.errorStateIcon,
              ]}>
              <FriendshipStatusIcon
                color={friendshipStatusIconTint}
                size={22}
              />
            </View>
            <View style={styles.emptyStateCopy}>
              <Text selectable={isFriendshipStatusError} style={styles.emptyStateTitle}>
                {friendshipStatusMessage}
              </Text>
            </View>
          </View>
        ) : (
          <>
            {!!friendshipActionError && (
              <View style={[styles.actionErrorCard, styles.errorStateCard]}>
                <Text testID="profile-friend-action-error" selectable style={styles.actionErrorText}>
                  {friendshipActionError}
                </Text>
              </View>
            )}

            <View style={styles.friendsSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionLabel}>Friend requests</Text>
              </View>

              {pendingFriendRequests.length > 0 ? (
                <View style={styles.friendsCard}>
                  {pendingFriendRequests.map((request, index) => (
                    <FriendRow
                      key={request.id}
                      testID={`profile-friend-request-row-${request.id}`}
                      friend={request}
                      index={index}
                      isLast={index === pendingFriendRequests.length - 1}
                      statusLabel="Accept"
                      actionLabel="Accept"
                      onActionPress={() => handleAcceptFriendRequest(request.id)}
                      isActionDisabled={acceptingFriendshipId === request.id || deletingFriendshipId === request.id}
                      onDeletePress={() => handleDeleteFriend(request.id)}
                      isDeleteDisabled={deletingFriendshipId === request.id || acceptingFriendshipId === request.id}
                      deleteAccessibilityLabel={`Delete friend request from ${request.displayName}`}
                      statusVariant="request"
                    />
                  ))}
                </View>
              ) : (
                <View style={styles.emptyStateCard}>
                  <View style={styles.emptyStateIcon}>
                    <HandshakeIcon color={colors.inkSoft} size={23} />
                  </View>
                  <View style={styles.emptyStateCopy}>
                    <Text style={styles.emptyStateTitle}>No pending requests</Text>
                  </View>
                </View>
              )}
            </View>

            <View style={styles.friendsSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionLabel}>Friends</Text>
              </View>

              {friendPreviews.length > 0 ? (
                <View style={styles.friendsCard}>
                  {friendPreviews.map((friend, index) => (
                    <FriendRow
                      key={friend.id}
                      testID={`profile-friend-row-${friend.id}`}
                      friend={friend}
                      index={index}
                      isLast={index === friendPreviews.length - 1}
                      onDeletePress={() => handleDeleteFriend(friend.id)}
                      isDeleteDisabled={deletingFriendshipId === friend.id}
                      deleteAccessibilityLabel={`Delete ${friend.displayName}`}
                    />
                  ))}
                </View>
              ) : (
                <View style={styles.emptyStateCard}>
                  <View style={styles.emptyStateIcon}>
                    <UsersThreeIcon color={colors.inkSoft} size={23} />
                  </View>
                  <View style={styles.emptyStateCopy}>
                    <Text style={styles.emptyStateTitle}>No friends yet</Text>
                    <Text style={styles.emptyStateText}>
                      Add the people you create memories with!
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </>
        )}

        <View style={styles.accountSection}>
          <Text style={styles.sectionLabel}>Account</Text>
          <Pressable
            testID="profile-sign-out-button"
            style={({ pressed }) => [
              styles.signOutButton,
              pressed && styles.signOutButtonPressed,
            ]}
            onPress={handleSignout}>
            <Text style={styles.signOutButtonText}>Sign out</Text>
          </Pressable>
          <Pressable
            testID="profile-delete-account-button"
            accessibilityLabel="Delete account"
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.deleteAccountButton,
              pressed && styles.deleteAccountButtonPressed,
            ]}
            onPress={handleDeleteAccountPress}>
            <TrashSimpleIcon color={colors.paperCard} size={16} weight="bold" />
            <Text style={styles.deleteAccountButtonText}>Delete account</Text>
          </Pressable>
          <Pressable
            testID="profile-privacy-policy-link"
            accessibilityLabel="Open privacy policy"
            accessibilityRole="link"
            hitSlop={8}
            style={({ pressed }) => [
              styles.privacyPolicyLink,
              pressed && styles.privacyPolicyLinkPressed,
            ]}
            onPress={handleOpenPrivacyPolicy}>
            <Text style={styles.privacyPolicyLinkText}>Privacy Policy</Text>
          </Pressable>
        </View>
      </ScrollView>

      <AddFriendSheet
        sheetRef={addFriendSheetRef}
        bottomInset={insets.bottom}
        friendUsername={friendUsername}
        errorMessage={addFriendError}
        isAddingFriend={isAddingFriend}
        onChangeFriendUsername={(username) => {
          setFriendUsername(username);
          setAddFriendError(null);
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
    paddingBottom: spacing.s8,
    gap: layout.sectionSpacing,
  },
  header: {
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
  friendStatusBadge: {
    minHeight: 44,
    minWidth: 64,
    borderRadius: radius.s,
    borderWidth: 1,
    borderColor: colors.paperEdge,
    paddingHorizontal: spacing.s3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.paper,
  },
  friendStatusBadgeText: {
    fontFamily: fonts.label,
    fontSize: type.micro.fontSize,
    lineHeight: type.micro.lineHeight,
    letterSpacing: type.micro.letterSpacing,
    textTransform: type.micro.textTransform,
    color: colors.inkMid,
  },
  acceptButton: {
    minHeight: 44,
    minWidth: 70,
    borderRadius: radius.s,
    borderWidth: 1,
    borderColor: colors.terracottaSoft,
    paddingHorizontal: spacing.s3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.paper,
  },
  acceptButtonPressed: {
    borderColor: colors.terracotta,
    backgroundColor: colors.terracottaSoft,
    transform: [{ scale: 0.98 }],
  },
  acceptButtonDisabled: {
    borderColor: colors.paperEdge,
    backgroundColor: colors.paperDeep,
    opacity: 0.65,
  },
  acceptButtonText: {
    fontFamily: fonts.label,
    fontSize: type.micro.fontSize,
    lineHeight: type.micro.lineHeight,
    letterSpacing: type.micro.letterSpacing,
    textTransform: type.micro.textTransform,
    color: colors.terracottaDeep,
  },
  friendRowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s2,
    flexShrink: 0,
  },
  deleteFriendButton: {
    width: 44,
    height: 44,
    borderRadius: radius.s,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.terracotta,
  },
  deleteFriendButtonPressed: {
    borderColor: colors.terracottaSoft,
    backgroundColor: colors.terracottaSoft,
    transform: [{ scale: 0.98 }],
  },
  deleteFriendButtonDisabled: {
    borderColor: colors.paperEdge,
    backgroundColor: colors.paperDeep,
    opacity: 0.65,
  },
  actionErrorCard: {
    borderRadius: radius.l,
    borderWidth: 1,
    borderColor: colors.terracottaSoft,
    backgroundColor: colors.paperCard,
    padding: layout.cardPadding,
    boxShadow: shadows.card,
  },
  actionErrorText: {
    fontFamily: fonts.bodyStrong,
    fontSize: type.bodyS.fontSize,
    lineHeight: type.bodyS.lineHeight,
    color: colors.terracottaDeep,
  },
  emptyStateCard: {
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
  errorStateCard: {
    borderColor: colors.terracottaSoft,
  },
  emptyStateIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.paperEdge,
  },
  errorStateIcon: {
    backgroundColor: colors.terracottaSoft,
    borderColor: colors.terracottaSoft,
  },
  emptyStateCopy: {
    flex: 1,
    minWidth: 0,
    gap: spacing.s1,
  },
  emptyStateTitle: {
    fontFamily: fonts.bodyStrong,
    fontSize: type.body.fontSize,
    lineHeight: type.body.lineHeight,
    color: colors.ink,
  },
  emptyStateText: {
    fontFamily: fonts.body,
    fontSize: type.bodyS.fontSize,
    lineHeight: type.bodyS.lineHeight,
    color: colors.inkMid,
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
  deleteAccountButton: {
    minHeight: 52,
    marginTop: spacing.s2,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s2,
    backgroundColor: colors.terracotta,
  },
  deleteAccountButtonPressed: {
    backgroundColor: colors.terracottaDeep,
  },
  deleteAccountButtonText: {
    fontFamily: fonts.bodyStrong,
    fontSize: type.body.fontSize,
    lineHeight: type.body.lineHeight,
    color: colors.paperCard,
  },
  privacyPolicyLink: {
    alignSelf: 'center',
    paddingHorizontal: spacing.s3,
    paddingVertical: spacing.s2,
  },
  privacyPolicyLinkPressed: {
    opacity: 0.55,
  },
  privacyPolicyLinkText: {
    fontFamily: fonts.body,
    fontSize: type.bodyS.fontSize,
    lineHeight: type.bodyS.lineHeight,
    color: colors.inkSoft,
    textDecorationLine: 'underline',
  },
});
