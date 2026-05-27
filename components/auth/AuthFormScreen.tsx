import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { recountTheme } from '@/constants/RecountTheme';

const { colors, layout, spacing } = recountTheme;

type AuthFormScreenProps = {
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthFormScreen({ children, footer }: AuthFormScreenProps) {
  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.formArea}>
          {children}
        </View>
        {footer}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.paper,
    paddingHorizontal: layout.mobileGutter,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: spacing.s7,
  },
  formArea: {
    flex: 1,
    gap: layout.verticalCardGap,
    justifyContent: 'center',
  },
});
