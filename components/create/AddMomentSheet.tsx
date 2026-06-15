import type BottomSheet from '@gorhom/bottom-sheet';
import { SymbolView } from 'expo-symbols';
import { useRef } from 'react';
import type { RefObject } from 'react';

import { PrimaryButton } from '@/components/ui/PrimaryButton';
import {
  BottomActionSheet,
  type SheetTextInputRef,
  SheetField,
  SheetForm,
  SheetTextInput,
} from '@/components/ui/BottomActionSheet';
import { inputLimits } from '@/constants/input-limits';
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
  const momentTimeInputRef = useRef<SheetTextInputRef>(null);

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
            returnKeyType="next"
            maxLength={inputLimits.momentTitle}
            onSubmitEditing={() => momentTimeInputRef.current?.focus()}
          />
        </SheetField>

        <SheetField label="Approx time">
          <SheetTextInput
            ref={momentTimeInputRef}
            value={newMomentTime}
            onChangeText={onChangeNewMomentTime}
            placeholder="10:45 PM"
            keyboardType="numbers-and-punctuation"
            returnKeyType="done"
            maxLength={inputLimits.momentApproxTime}
            onSubmitEditing={onAddMoment}
          />
        </SheetField>
      </SheetForm>
    </BottomActionSheet>
  );
}
