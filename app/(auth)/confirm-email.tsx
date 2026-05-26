import { Text, View, StyleSheet } from 'react-native';
import { recountColors, recountType } from '@/constants/RecountTheme';

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
    backgroundColor: recountColors.paper,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontFamily: recountType.label.fontFamily,
    fontSize: recountType.bodyL.fontSize,
    letterSpacing: recountType.label.letterSpacing,
    color: recountColors.inkMid,
  }
});