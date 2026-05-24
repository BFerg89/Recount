import { SymbolView } from 'expo-symbols';
import { StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import { nightLogTheme } from '@/constants/NightLogTheme';

const { colors, fonts, radius, spacing, type } = nightLogTheme;

type PersonPillProps = {
  displayName: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

export function PersonPill({ displayName, style, textStyle }: PersonPillProps) {
  return (
    <View style={[styles.container, style]}>
      <SymbolView
        name={{
          ios: 'person.circle',
          android: 'person',
        }}
        tintColor={colors.ink}
      />
      <Text style={[styles.text, textStyle]}>{displayName}</Text>
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
  text: {
    fontFamily: fonts.label,
    fontSize: type.bodyS.fontSize,
    lineHeight: type.bodyS.lineHeight,
    color: colors.ink,
  },
});
