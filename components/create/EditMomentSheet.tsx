import type BottomSheet from '@gorhom/bottom-sheet';
import { PathIcon, TrashSimpleIcon } from 'phosphor-react-native';
import { useRef } from 'react';
import type { RefObject } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

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

const { colors, fonts, radius, shadows, spacing, type } = recountTheme;

type EditMomentSheetProps = {
  sheetRef: RefObject<BottomSheet | null>;
  bottomInset: number;
  momentTitle: string;
  onChangeMomentTitle: (title: string) => void;
  momentTime: string;
  onChangeMomentTime: (time: string) => void;
  onSaveMoment: () => void;
  onDeleteMoment: () => void;
};

export function EditMomentSheet({
  sheetRef,
  bottomInset,
  momentTitle,
  onChangeMomentTitle,
  momentTime,
  onChangeMomentTime,
  onSaveMoment,
  onDeleteMoment,
}: EditMomentSheetProps) {
  const momentTimeInputRef = useRef<SheetTextInputRef>(null);

  return (
    <BottomActionSheet
      sheetRef={sheetRef}
      bottomInset={bottomInset}
      eyebrow="Timeline"
      title="Edit moment"
      footer={(
        <View style={styles.footer}>
          <PrimaryButton
            label="Update moment"
            onPress={onSaveMoment}
            icon={(
              <PathIcon color={colors.paperCard} size={18} weight="bold" />
            )}
          />
          <Pressable
            accessibilityLabel="Delete moment"
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.deleteButton,
              pressed && styles.deleteButtonPressed,
            ]}
            onPress={onDeleteMoment}>
            {({ pressed }) => (
              <>
                <TrashSimpleIcon
                  color={pressed ? colors.paperCard : colors.terracottaDeep}
                  size={18}
                  weight="bold"
                />
                <Text style={[
                  styles.deleteButtonText,
                  pressed && styles.deleteButtonTextPressed,
                ]}>
                  Delete moment
                </Text>
              </>
            )}
          </Pressable>
        </View>
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

const styles = StyleSheet.create({
  footer: {
    gap: spacing.s2,
  },
  deleteButton: {
    minHeight: 48,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.terracottaDeep,
    backgroundColor: colors.paperCard,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.s2,
  },
  deleteButtonPressed: {
    backgroundColor: colors.terracottaDeep,
    boxShadow: shadows.press,
    transform: [{ scale: 0.98 }],
  },
  deleteButtonText: {
    fontFamily: fonts.bodyStrong,
    fontSize: type.body.fontSize,
    lineHeight: type.body.lineHeight,
    color: colors.terracottaDeep,
  },
  deleteButtonTextPressed: {
    color: colors.paperCard,
  },
});
