import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { recountTheme } from '@/constants/RecountTheme';

const { colors, fonts, radius, shadows, spacing, type } = recountTheme;

type PrimaryButtonRenderState = {
  pressed: boolean;
  disabled: boolean;
};

type PrimaryButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  icon?: ReactNode | ((state: PrimaryButtonRenderState) => ReactNode);
  variant?: 'default' | 'save';
  style?: StyleProp<ViewStyle>;
  pressedStyle?: StyleProp<ViewStyle>;
  disabledStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

export function PrimaryButton({
  label,
  icon,
  variant = 'default',
  disabled = false,
  style,
  pressedStyle,
  disabledStyle,
  textStyle,
  accessibilityState,
  ...pressableProps
}: PrimaryButtonProps) {
  const isDisabled = disabled === true;

  return (
    <Pressable
      {...pressableProps}
      disabled={isDisabled}
      accessibilityState={{ ...accessibilityState, disabled: isDisabled }}
      style={({ pressed }) => [
        styles.base,
        variant === 'save' ? styles.save : styles.default,
        style,
        pressed && !isDisabled && styles.pressed,
        pressed && !isDisabled && pressedStyle,
        isDisabled && styles.disabled,
        isDisabled && disabledStyle,
      ]}
    >
      {({ pressed }) => (
        <>
          {typeof icon === 'function' ? icon({ pressed, disabled: isDisabled }) : icon}
          <Text style={[styles.text, textStyle]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    backgroundColor: colors.terracotta,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.s2,
  },
  default: {
    minHeight: 50,
    paddingHorizontal: spacing.s4,
  },
  save: {
    minHeight: 40,
    boxShadow: shadows.card,
  },
  pressed: {
    backgroundColor: colors.terracottaDeep,
    boxShadow: shadows.press,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontFamily: fonts.bodyStrong,
    fontSize: type.body.fontSize,
    lineHeight: type.body.lineHeight,
    color: colors.paperCard,
  },
});
