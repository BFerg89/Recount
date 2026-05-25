import { Text, View, StyleSheet } from 'react-native';
import { nightLogColors, nightLogType } from '@/constants/NightLogTheme';

export default function ConfirmEmail() {
  return (
    <View style={styles.screen}>
      <Text style={styles.text}>Please Verify Email</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: nightLogColors.paper,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontFamily: nightLogType.label.fontFamily,
    fontSize: nightLogType.bodyL.fontSize,
    letterSpacing: nightLogType.label.letterSpacing,
    color: nightLogColors.inkMid,
  }
});