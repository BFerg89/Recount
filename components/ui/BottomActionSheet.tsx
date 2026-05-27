import BottomSheet, { BottomSheetTextInput, BottomSheetView } from '@gorhom/bottom-sheet';
import type { ComponentProps, ReactNode, RefObject } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { recountTheme } from '@/constants/RecountTheme';

const { colors, fonts, layout, radius, shadows, spacing, type } = recountTheme;

type SheetTextInputProps = ComponentProps<typeof BottomSheetTextInput>;

type BottomActionSheetProps = {
  sheetRef: RefObject<BottomSheet | null>;
  bottomInset: number;
  eyebrow: string;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
};

type SheetFieldProps = {
  label: string;
  children: ReactNode;
};

type PrefixedSheetTextInputProps = SheetTextInputProps & {
  prefix: string;
};

export function BottomActionSheet({
  sheetRef,
  bottomInset,
  eyebrow,
  title,
  children,
  footer,
}: BottomActionSheetProps) {
  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      enableDynamicSizing
      enablePanDownToClose
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.sheetHandle}
    >
      <BottomSheetView
        style={[styles.sheetContent, { paddingBottom: bottomInset + spacing.s6 }]}>
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetEyebrow}>{eyebrow}</Text>
          <Text style={styles.sheetTitle}>{title}</Text>
        </View>

        {children}
        {footer}
      </BottomSheetView>
    </BottomSheet>
  );
}

export function SheetForm({ children }: { children: ReactNode }) {
  return (
    <View style={styles.sheetForm}>
      {children}
    </View>
  );
}

export function SheetField({ label, children }: SheetFieldProps) {
  return (
    <View style={styles.sheetField}>
      <Text style={styles.sheetFieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

export function SheetTextInput({
  placeholderTextColor = colors.inkSoft,
  selectionColor = colors.terracotta,
  style,
  ...textInputProps
}: SheetTextInputProps) {
  return (
    <BottomSheetTextInput
      placeholderTextColor={placeholderTextColor}
      selectionColor={selectionColor}
      style={[styles.sheetTextInput, style]}
      {...textInputProps}
    />
  );
}

export function PrefixedSheetTextInput({
  prefix,
  placeholderTextColor = colors.inkSoft,
  selectionColor = colors.terracotta,
  style,
  ...textInputProps
}: PrefixedSheetTextInputProps) {
  return (
    <View style={styles.prefixedInputContainer}>
      <Text style={styles.prefixText}>{prefix}</Text>
      <BottomSheetTextInput
        placeholderTextColor={placeholderTextColor}
        selectionColor={selectionColor}
        style={[styles.prefixedTextInput, style]}
        {...textInputProps}
      />
    </View>
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
  sheetBackground: {
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
  prefixedInputContainer: {
    minHeight: 52,
    borderRadius: radius.m,
    borderWidth: 1,
    borderColor: colors.paperEdge,
    backgroundColor: colors.paper,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.s4,
    paddingVertical: spacing.s3,
  },
  prefixText: {
    fontFamily: fonts.body,
    fontSize: type.bodyL.fontSize,
    lineHeight: type.bodyL.lineHeight,
    includeFontPadding: false,
    color: colors.ink,
  },
  prefixedTextInput: {
    flex: 1,
    padding: 0,
    fontFamily: fonts.body,
    fontSize: type.bodyL.fontSize,
    lineHeight: type.bodyL.lineHeight,
    includeFontPadding: false,
    textAlignVertical: 'center',
    transform: [{ translateY: -1 }],
    color: colors.ink,
  },
});
