import { forwardRef } from 'react';
import { StyleSheet, TextInput, type TextInputProps } from 'react-native';

import { nightLogTheme } from '@/constants/NightLogTheme';

const { colors, fonts, radius, spacing, type } = nightLogTheme;

type AuthTextInputProps = TextInputProps;

export const AuthTextInput = forwardRef<TextInput, AuthTextInputProps>(function AuthTextInput({
  placeholderTextColor = colors.inkSoft,
  selectionColor = colors.terracotta,
  style,
  ...textInputProps
}, ref) {
  return (
    <TextInput
      ref={ref}
      placeholderTextColor={placeholderTextColor}
      selectionColor={selectionColor}
      style={[styles.textInput, style]}
      {...textInputProps}
    />
  );
});

const styles = StyleSheet.create({
  textInput: {
    minHeight: 52,
    borderRadius: radius.m,
    borderWidth: 1,
    borderColor: colors.paperEdge,
    backgroundColor: colors.paperCard,
    paddingHorizontal: spacing.s4,
    paddingVertical: spacing.s3,
    fontFamily: fonts.body,
    fontSize: type.bodyL.fontSize,
    lineHeight: type.bodyL.lineHeight,
    color: colors.ink,
  },
});
