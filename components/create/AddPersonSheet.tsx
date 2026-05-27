import type BottomSheet from '@gorhom/bottom-sheet';
import { SymbolView } from 'expo-symbols';
import type { RefObject } from 'react';

import { PrimaryButton } from '@/components/ui/PrimaryButton';
import {
  BottomActionSheet,
  SheetField,
  SheetForm,
  SheetTextInput,
} from '@/components/ui/BottomActionSheet';
import { recountTheme } from '@/constants/RecountTheme';
const { colors } = recountTheme;

type AddPersonSheetProps = {
  sheetRef: RefObject<BottomSheet | null>;
  bottomInset: number;
  newPersonName: string;
  onChangeNewPersonName: (name: string) => void;
  onAddPerson: () => void;
};

export function AddPersonSheet({
  sheetRef,
  bottomInset,
  newPersonName,
  onChangeNewPersonName,
  onAddPerson,
}: AddPersonSheetProps) {
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
      <SheetForm>
        <SheetField label="Name">
          <SheetTextInput
            value={newPersonName}
            onChangeText={onChangeNewPersonName}
            placeholder="Name..."
            autoCapitalize="words"
            returnKeyType="done"
          />
        </SheetField>
      </SheetForm>
    </BottomActionSheet>
  );
}
