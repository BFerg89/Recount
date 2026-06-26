import type BottomSheet from '@gorhom/bottom-sheet';
import { PathIcon } from 'phosphor-react-native';
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

type EditMomentSheetProps = {
  sheetRef: RefObject<BottomSheet | null>;
  bottomInset: number;
  momentTitle: string;
  onChangeMomentTitle: (title: string) => void;
  momentTime: string;
  onChangeMomentTime: (time: string) => void;
  onSaveMoment: () => void;
};

export function EditMomentSheet({
  sheetRef,
  bottomInset,
  momentTitle,
  onChangeMomentTitle,
  momentTime,
  onChangeMomentTime,
  onSaveMoment,
}: EditMomentSheetProps) {
  const momentTimeInputRef = useRef<SheetTextInputRef>(null);

  return (
    <BottomActionSheet
      sheetRef={sheetRef}
      bottomInset={bottomInset}
      eyebrow="Timeline"
      title="Edit moment"
      footer={(
        <PrimaryButton
          label="Update moment"
          onPress={onSaveMoment}
          icon={(
            <PathIcon color={colors.paperCard} size={18} weight="bold" />
          )}
        />
      )}>
      <SheetForm>
        <SheetField label="Title">
          <SheetTextInput
            value={momentTitle}
            onChangeText={onChangeMomentTitle}
            placeholder="What happened?"
            autoCapitalize="sentences"
            returnKeyType="next"
            maxLength={inputLimits.momentTitle}
            onSubmitEditing={() => momentTimeInputRef.current?.focus()}
          />
        </SheetField>

        <SheetField label="Approx time">
          <SheetTextInput
            ref={momentTimeInputRef}
            value={momentTime}
            onChangeText={onChangeMomentTime}
            placeholder="10:45 PM"
            keyboardType="numbers-and-punctuation"
            returnKeyType="done"
            maxLength={inputLimits.momentApproxTime}
            onSubmitEditing={onSaveMoment}
          />
        </SheetField>
      </SheetForm>
    </BottomActionSheet>
  );
}
