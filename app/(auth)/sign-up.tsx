import { StyleSheet, View } from 'react-native';
import { nightLogTheme } from '@/constants/NightLogTheme';

const { colors, fonts, layout, radius, shadows, spacing, type } = nightLogTheme;

export default function SignUpScreen() {
  return (
    <View style={styles.screen}>
      <View style={styles.content}>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.paper,
    paddingTop: layout.statusBarSpace,
    paddingHorizontal: layout.mobileGutter,
  },
  content: {
    flex: 1,
    backgroundColor: 'green',
  }
});
