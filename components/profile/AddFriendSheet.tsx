import type BottomSheet from '@gorhom/bottom-sheet';
import { SymbolView } from 'expo-symbols';
import type { RefObject } from 'react';

import { PrimaryButton } from '@/components/ui/PrimaryButton';
import {
  BottomActionSheet,
  PrefixedSheetTextInput,
  SheetField,
  SheetForm,
} from '@/components/ui/BottomActionSheet';
import { recountTheme } from '@/constants/RecountTheme';

const { colors } = recountTheme;

type AddFriendSheetProps = {
  sheetRef: RefObject<BottomSheet | null>;
  bottomInset: number;
  friendUsername: string;
  errorMessage?: string | null;
  isAddingFriend: boolean;
  onChangeFriendUsername: (username: string) => void;
  onAddFriend: () => void;
};

export function AddFriendSheet({
  sheetRef,
  bottomInset,
  friendUsername,
  errorMessage,
  isAddingFriend,
  onChangeFriendUsername,
  onAddFriend,
}: AddFriendSheetProps) {
  const handleChangeFriendUsername = (username: string) => {
    onChangeFriendUsername(username.replace(/^@+/, ''));
  };

  return (
    <BottomActionSheet
      sheetRef={sheetRef}
      bottomInset={bottomInset}
      eyebrow="Profile"
      title="Add friend"
      footer={(
        <PrimaryButton
          label="Add friend"
          onPress={onAddFriend}
          disabled={isAddingFriend}
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
      <SheetForm>
        <SheetField label="Username" errorMessage={errorMessage}>
          <PrefixedSheetTextInput
            prefix="@"
            value={friendUsername}
            onChangeText={handleChangeFriendUsername}
            placeholder="username..."
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="username"
            textContentType="username"
            returnKeyType="done"
            editable={!isAddingFriend}
            onSubmitEditing={isAddingFriend ? undefined : onAddFriend}
          />
        </SheetField>
      </SheetForm>
    </BottomActionSheet>
  );
}
