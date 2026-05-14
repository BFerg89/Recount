import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const contentPadding = 16;
const screenBackgroundColor = '#F5F2EA';
const headlineFontFamily = 'Newsreader_700Bold';
const bodyFontFamily = 'BeVietnamPro_400Regular';
const bodyStrongFontFamily = 'BeVietnamPro_600SemiBold';
const labelFontFamily = 'SplineSans_500Medium';

export default function CreateScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.screen, { paddingTop: insets.top + 12 }]}>
      <Text style={styles.title}>Create Log</Text>
      <ScrollView style={styles.contentContainer} contentContainerStyle={styles.content}>
        <Text style={{ backgroundColor: 'green'}}>**Title Field**</Text>
        <Text style={{ backgroundColor: 'red'}}>**Date Field**</Text>
        <View style={[styles.section, styles.timelineSection]}>
          <Text style={styles.sectionLabel}>Timeline</Text>
        </View>
        <View style={[styles.section, styles.notesSection]}>
          <Text style={styles.sectionLabel}>Notes</Text>
        </View>
        <View style={[styles.section, styles.peopleSection]}>
          <Text style={styles.sectionLabel}>People</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    gap: 8,
    backgroundColor: screenBackgroundColor,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: 'orange',
  },
  title: {
    paddingHorizontal: 24,
    fontFamily: headlineFontFamily,
    fontSize: 32,
  },
  content: {
    flexGrow: 1,
    padding: contentPadding,
    gap: 16,
  },
  section: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineSection: {
    backgroundColor: '#B8E6D1',
  },
  notesSection: {
    backgroundColor: '#C8D7FF',
  },
  peopleSection: {
    backgroundColor: '#FFD0B8',
  },
  sectionLabel: {
    fontFamily: labelFontFamily,
    fontSize: 16,
    color: '#111827',
  },
});
