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

type AddMomentSheetProps = {
  sheetRef: RefObject<BottomSheet | null>;
  bottomInset: number;
  newMomentTitle: string;
  onChangeNewMomentTitle: (title: string) => void;
  newMomentTime: string;
  onChangeNewMomentTime: (time: string) => void;
  onAddMoment: () => void;
};

export function AddMomentSheet({
  sheetRef,
  bottomInset,
  newMomentTitle,
  onChangeNewMomentTitle,
  newMomentTime,
  onChangeNewMomentTime,
  onAddMoment,
}: AddMomentSheetProps) {
  return (
    <BottomActionSheet
      sheetRef={sheetRef}
      bottomInset={bottomInset}
      eyebrow="Timeline"
      title="Add moment"
      footer={(
        <PrimaryButton
          label="Add moment"
          onPress={onAddMoment}
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
        <SheetField label="Title">
          <SheetTextInput
            value={newMomentTitle}
            onChangeText={onChangeNewMomentTitle}
            placeholder="What happened next?"
            autoCapitalize="sentences"
          />
        </SheetField>

        <SheetField label="Approx time">
          <SheetTextInput
            value={newMomentTime}
            onChangeText={onChangeNewMomentTime}
            placeholder="10:45 PM"
            keyboardType="numbers-and-punctuation"
          />
        </SheetField>
      </SheetForm>
    </BottomActionSheet>
  );
}
