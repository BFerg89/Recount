import { UserCircleIcon, XIcon } from 'phosphor-react-native';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { recountTheme } from '@/constants/RecountTheme';

const { colors, fonts, radius, spacing, type } = recountTheme;

type PersonPillProps = {
  displayName: string;
  showRemoveIcon?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  textStyle?: StyleProp<TextStyle>;
};

export function PersonPill({
  displayName,
  showRemoveIcon = false,
  onPress,
  style,
  testID,
  textStyle,
}: PersonPillProps) {
  const renderContent = (pressed = false) => (
    <>
      <UserCircleIcon color={pressed ? colors.terracottaDeep : colors.ink} size={16} />
      <Text style={[styles.text, pressed && styles.textPressed, textStyle]}>{displayName}</Text>
      {showRemoveIcon && (
        <XIcon
          color={pressed ? colors.terracottaDeep : colors.inkSoft}
          size={12}
          weight="bold"
        />
      )}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        testID={testID}
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [
          styles.container,
          styles.containerPressable,
          pressed && styles.containerPressed,
          style,
        ]}>
        {({ pressed }) => renderContent(pressed)}
      </Pressable>
    );
  }

  return (
    <View testID={testID} style={[styles.container, style]}>
      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.paperCard,
    justifyContent: 'center',
    gap: spacing.s1,
    borderWidth: 1,
    borderColor: colors.paperEdge,
    borderRadius: radius.pill,
    paddingLeft: spacing.s1,
    paddingRight: spacing.s2,
    minHeight: 32,
  },
  containerPressable: {
    paddingRight: spacing.s2,
  },
  containerPressed: {
    backgroundColor: colors.terracottaSoft,
    borderColor: colors.terracotta,
    transform: [{ scale: 0.98 }],
  },
  text: {
    fontFamily: fonts.label,
    fontSize: type.bodyS.fontSize,
    lineHeight: type.bodyS.lineHeight,
    color: colors.ink,
  },
  textPressed: {
    color: colors.terracottaDeep,
  },
});
