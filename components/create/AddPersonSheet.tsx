import BottomSheet, { BottomSheetTextInput, BottomSheetView } from '@gorhom/bottom-sheet';
import { SymbolView } from 'expo-symbols';
import type { RefObject } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { nightLogTheme } from '@/constants/NightLogTheme';
const { colors, fonts, layout, radius, shadows, spacing, type } = nightLogTheme;

type AddPersonSheetProps = {
  sheetRef: RefObject<BottomSheet | null>;
  bottomInset: number;
  newPersonName: string;
  onChangeNewPersonName: (name: string) => void;
  onAddPerson: () => void;
}

export function AddPersonSheet({
  sheetRef,
  bottomInset,
  newPersonName,
  onChangeNewPersonName,
  onAddPerson,
}: AddPersonSheetProps) {
  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      enableDynamicSizing
      enablePanDownToClose
      backgroundStyle={styles.addPeopleSheetBackground}
      handleIndicatorStyle={styles.sheetHandle}
    >
      <BottomSheetView
        style={[styles.sheetContent, { paddingBottom: bottomInset + spacing.s6 }]}>
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetEyebrow}>People</Text>
          <Text style={styles.sheetTitle}>Add person</Text>
        </View>

        <View style={styles.sheetForm}>
          <View style={styles.sheetField}>
            <Text style={styles.sheetFieldLabel}>Name</Text>
            <BottomSheetTextInput
              value={newPersonName}
              onChangeText={onChangeNewPersonName}
              placeholder="Name..."
              placeholderTextColor={colors.inkSoft}
              autoCapitalize="words"
              returnKeyType="done"
              selectionColor={colors.terracotta}
              style={styles.sheetTextInput}
            />
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.sheetPrimaryButton,
            pressed && styles.sheetPrimaryButtonPressed,
          ]}
          onPress={onAddPerson}>
          <SymbolView
            name={{
              ios: 'plus.circle.fill',
              android: 'add_circle',
            }}
            tintColor={colors.paperCard}
            size={18}
          />
          <Text style={styles.sheetPrimaryButtonText}>Add person</Text>
        </Pressable>
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetHandle: {
    width: 44,
    backgroundColor: colors.rule,
  },
  sheetContent: {
    paddingHorizontal: layout.mobileGutter,
    paddingTop: spacing.s2,
    gap: spacing.s5,
    backgroundColor: colors.paperCard,
  },
  addPeopleSheetBackground: {
    backgroundColor: colors.paperCard,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.paperEdge,
    boxShadow: shadows.pop,
  },
  sheetHeader: {
    gap: spacing.s1,
  },
  sheetEyebrow: {
    fontFamily: fonts.label,
    fontSize: type.micro.fontSize,
    lineHeight: type.micro.lineHeight,
    letterSpacing: type.micro.letterSpacing,
    textTransform: type.micro.textTransform,
    color: colors.inkSoft,
  },
  sheetTitle: {
    fontFamily: fonts.display,
    fontSize: type.displayS.fontSize,
    lineHeight: type.displayS.lineHeight,
    letterSpacing: type.displayS.letterSpacing,
    color: colors.ink,
  },
  sheetForm: {
    gap: spacing.s4,
  },
  sheetField: {
    gap: spacing.s2,
  },
  sheetFieldLabel: {
    fontFamily: fonts.label,
    fontSize: type.label.fontSize,
    lineHeight: type.label.lineHeight,
    letterSpacing: type.label.letterSpacing,
    textTransform: type.label.textTransform,
    color: colors.inkMid,
  },
  sheetTextInput: {
    minHeight: 52,
    borderRadius: radius.m,
    borderWidth: 1,
    borderColor: colors.paperEdge,
    backgroundColor: colors.paper,
    paddingHorizontal: spacing.s4,
    paddingVertical: spacing.s3,
    fontFamily: fonts.body,
    fontSize: type.bodyL.fontSize,
    lineHeight: type.bodyL.lineHeight,
    color: colors.ink,
  },
  sheetPrimaryButton: {
    minHeight: 50,
    borderRadius: radius.pill,
    backgroundColor: colors.terracotta,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.s2,
    paddingHorizontal: spacing.s4,
  },
  sheetPrimaryButtonPressed: {
    backgroundColor: colors.terracottaDeep,
    boxShadow: shadows.press,
    transform: [{ scale: 0.98 }],
  },
  sheetPrimaryButtonText: {
    fontFamily: fonts.bodyStrong,
    fontSize: type.body.fontSize,
    lineHeight: type.body.lineHeight,
    color: colors.paperCard,
  },
});