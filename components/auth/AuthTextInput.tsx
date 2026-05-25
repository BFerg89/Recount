import { forwardRef } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { nightLogTheme } from '@/constants/NightLogTheme';

const { colors, fonts, radius, spacing, type } = nightLogTheme;

type AuthTextInputProps = TextInputProps & {
  prefix?: string;
};

export const AuthTextInput = forwardRef<TextInput, AuthTextInputProps>(function AuthTextInput({
  placeholderTextColor = colors.inkSoft,
  prefix,
  selectionColor = colors.terracotta,
  style,
  ...textInputProps
}, ref) {
  if (prefix) {
    return (
      <View style={styles.prefixedInputContainer}>
        <Text style={styles.prefixText}>{prefix}</Text>
        <TextInput
          ref={ref}
          placeholderTextColor={placeholderTextColor}
          selectionColor={selectionColor}
          style={[styles.prefixedTextInput, style]}
          {...textInputProps}
        />
      </View>
    );
  }

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
  prefixedInputContainer: {
    minHeight: 52,
    borderRadius: radius.m,
    borderWidth: 1,
    borderColor: colors.paperEdge,
    backgroundColor: colors.paperCard,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.s4,
    paddingVertical: spacing.s3,
  },
  prefixText: {
    fontFamily: fonts.body,
    fontSize: type.bodyL.fontSize,
    lineHeight: type.bodyL.lineHeight,
    color: colors.ink,
  },
  prefixedTextInput: {
    flex: 1,
    padding: 0,
    fontFamily: fonts.body,
    fontSize: type.bodyL.fontSize,
    lineHeight: type.bodyL.lineHeight,
    color: colors.ink,
  },
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
