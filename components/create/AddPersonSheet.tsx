import type BottomSheet from '@gorhom/bottom-sheet';
import { SymbolView } from 'expo-symbols';
import type { RefObject } from 'react';
import { Pressable, StyleSheet, Text, View, ScrollView } from 'react-native';

import { PrimaryButton } from '@/components/ui/PrimaryButton';
import {
  BottomActionSheet,
  SheetField,
  SheetForm,
  SheetTextInput,
} from '@/components/ui/BottomActionSheet';
import { inputLimits } from '@/constants/input-limits';
import { recountTheme } from '@/constants/RecountTheme';

const { colors, fonts, radius, spacing, type } = recountTheme;

export type AddPersonFriend = {
  id: string;
  displayName: string;
  username: string;
};

type AddPersonSheetProps = {
  sheetRef: RefObject<BottomSheet | null>;
  bottomInset: number;
  friends: AddPersonFriend[];
  addedFriendIds: string[];
  isFriendsLoading: boolean;
  friendsError: string | null;
  onAddFriendPerson: (friend: AddPersonFriend) => void;
  newPersonName: string;
  onChangeNewPersonName: (name: string) => void;
  onAddPerson: () => void;
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

type FriendOptionRowProps = {
  friend: AddPersonFriend;
  index: number;
  isAdded: boolean;
  isLast: boolean;
  onPress: () => void;
};

function FriendOptionRow({
  friend,
  index,
  isAdded,
  isLast,
  onPress,
}: FriendOptionRowProps) {
  return (
    <Pressable
      accessibilityLabel={
        isAdded
          ? `${friend.displayName} already added`
          : `Add ${friend.displayName}`
      }
      accessibilityRole="button"
      accessibilityState={{ disabled: isAdded }}
      disabled={isAdded}
      onPress={onPress}
      style={({ pressed }) => [
        styles.friendRow,
        isLast && styles.lastFriendRow,
        pressed && styles.friendRowPressed,
        isAdded && styles.friendRowDisabled,
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

      <View style={styles.friendAction}>
        <SymbolView
          name={
            isAdded
              ? { ios: 'checkmark.circle.fill', android: 'check_circle' }
              : { ios: 'plus.circle', android: 'add_circle' }
          }
          tintColor={isAdded ? colors.inkSoft : colors.terracotta}
          size={20}
        />
      </View>
    </Pressable>
  );
}

export function AddPersonSheet({
  sheetRef,
  bottomInset,
  friends,
  addedFriendIds,
  isFriendsLoading,
  friendsError,
  onAddFriendPerson,
  newPersonName,
  onChangeNewPersonName,
  onAddPerson,
}: AddPersonSheetProps) {
  const addedFriendIdsSet = new Set(addedFriendIds);
  const hasFriends = friends.length > 0;
  const friendsStatusMessage = isFriendsLoading
    ? 'Loading friends...'
    : friendsError
      ? 'Could not load friends'
      : hasFriends
        ? null
        : 'No friends yet';
  const friendsStatusIconName = isFriendsLoading
    ? ({ ios: 'hourglass', android: 'hourglass_empty' } as const)
    : friendsError
      ? ({ ios: 'exclamationmark.circle', android: 'error_outline' } as const)
      : ({ ios: 'person.2', android: 'group' } as const);

  return (
    <BottomActionSheet
      sheetRef={sheetRef}
      bottomInset={bottomInset}
      eyebrow="People"
      title="Add person"
      footer={(
        <PrimaryButton
          label="Add person"
          onPress={onAddPerson}
          icon={(
            <SymbolView
              name={{
                ios: 'plus.circle.fill',
                android: 'add_circle',
              }}
              tintColor={colors.paperCard}
              size={18}
            />
          )}
        />
      )}>
      <View style={styles.sheetBody}>
        <View style={styles.sheetSection}>
          <Text style={styles.sectionLabel}>Friends</Text>

          {friendsStatusMessage ? (
            <View style={styles.friendsStateCard}>
              <View style={styles.friendsStateIcon}>
                <SymbolView
                  name={friendsStatusIconName}
                  tintColor={friendsError ? colors.terracottaDeep : colors.inkSoft}
                  size={20}
                />
              </View>
              <Text
                selectable={friendsError !== null}
                style={[
                  styles.friendsStateText,
                  friendsError && styles.friendsStateErrorText,
                ]}>
                {friendsStatusMessage}
              </Text>
            </View>
          ) : (
            <View style={styles.friendsListCard}>
              <ScrollView
                nestedScrollEnabled
                showsVerticalScrollIndicator={false}
                style={styles.friendsListScroll}
                contentContainerStyle={styles.friendsListContent}>
                {friends.map((friend, index) => {
                  const isAdded = addedFriendIdsSet.has(friend.id);

                  return (
                    <FriendOptionRow
                      key={friend.id}
                      friend={friend}
                      index={index}
                      isAdded={isAdded}
                      isLast={index === friends.length - 1}
                      onPress={() => onAddFriendPerson(friend)}
                    />
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>

        <View style={styles.sheetSection}>
          <SheetForm>
            <SheetField label="Add someone else">
              <SheetTextInput
                value={newPersonName}
                onChangeText={onChangeNewPersonName}
                placeholder="Name..."
                autoCapitalize="words"
                returnKeyType="done"
                maxLength={inputLimits.personDisplayName}
                onSubmitEditing={onAddPerson}
              />
            </SheetField>
          </SheetForm>
        </View>
      </View>
    </BottomActionSheet>
  );
}

const styles = StyleSheet.create({
  sheetBody: {
    gap: spacing.s5,
  },
  sheetSection: {
    gap: spacing.s2,
  },
  sectionLabel: {
    fontFamily: fonts.label,
    fontSize: type.label.fontSize,
    lineHeight: type.label.lineHeight,
    letterSpacing: type.label.letterSpacing,
    textTransform: type.label.textTransform,
    color: colors.inkMid,
  },
  friendsListCard: {
    borderWidth: 1,
    borderColor: colors.paperEdge,
    borderRadius: radius.m,
    backgroundColor: colors.paper,
    overflow: 'hidden',
  },
  friendsListScroll: {
    maxHeight: 232,
  },
  friendsListContent: {
    flexGrow: 1,
  },
  friendRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s3,
    borderBottomWidth: 1,
    borderBottomColor: colors.rule,
    paddingLeft: spacing.s3,
    paddingRight: spacing.s2,
    paddingVertical: spacing.s2,
    backgroundColor: colors.paper,
  },
  lastFriendRow: {
    borderBottomWidth: 0,
  },
  friendRowPressed: {
    backgroundColor: colors.paperEdge,
  },
  friendRowDisabled: {
    opacity: 0.5,
  },
  friendAvatar: {
    width: 38,
    height: 38,
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
    lineHeight: type.body.lineHeight,
    color: colors.ink,
  },
  friendUsername: {
    fontFamily: fonts.body,
    fontSize: type.bodyS.fontSize,
    lineHeight: type.bodyS.lineHeight,
    color: colors.inkSoft,
  },
  friendAction: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  friendsStateCard: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s3,
    borderWidth: 1,
    borderColor: colors.paperEdge,
    borderRadius: radius.m,
    backgroundColor: colors.paper,
    paddingHorizontal: spacing.s3,
    paddingVertical: spacing.s2,
  },
  friendsStateIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.paperCard,
    borderWidth: 1,
    borderColor: colors.paperEdge,
  },
  friendsStateText: {
    flex: 1,
    fontFamily: fonts.bodyStrong,
    fontSize: type.body.fontSize,
    lineHeight: type.body.lineHeight,
    color: colors.inkMid,
  },
  friendsStateErrorText: {
    color: colors.terracottaDeep,
  },
});
