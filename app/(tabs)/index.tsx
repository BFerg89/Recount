import { ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text, View } from '@/components/Themed';

const contentPadding = 20;
const monthSectionPadding = 16;
const gridGap = 12;
const screenBackgroundColor = '#F5F2EA';
const headlineFontFamily = 'Newsreader_700Bold';
const bodyFontFamily = 'BeVietnamPro_400Regular';
const bodyStrongFontFamily = 'BeVietnamPro_600SemiBold';
const labelFontFamily = 'SplineSans_500Medium';

const monthSections = [
  {
    id: 'jan-2026',
    title: 'Jan 2026',
    logs: [
      { id: 'jan-1', day: '03', weekday: 'Sat', title: 'Pub Night', time: '8:15 PM' },
      { id: 'jan-2', day: '06', weekday: 'Tue', title: 'Club 601', time: '11:40 PM' },
      { id: 'jan-3', day: '11', weekday: 'Sun', title: 'Birthday Drinks', time: '9:10 PM' },
      { id: 'jan-4', day: '18', weekday: 'Sun', title: 'Karaoke Night', time: '10:45 PM' },
    ],
  },
  {
    id: 'feb-2026',
    title: 'Feb 2026',
    logs: [
      { id: 'feb-1', day: '02', weekday: 'Mon', title: 'Post-Work Drinks', time: '7:50 PM' },
      { id: 'feb-2', day: '09', weekday: 'Mon', title: 'The George', time: '8:20 PM' },
      { id: 'feb-3', day: '14', weekday: 'Sat', title: 'Valentines Out', time: '8:30 PM' },
    ],
  },
];

export default function TabOneScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const logCardWidth = (width - contentPadding * 2 - monthSectionPadding * 2 - gridGap) / 2;

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 12 }]}>
      <Text style={styles.title}>Logs</Text>
      <ScrollView
        style={styles.contentContainer}
        contentContainerStyle={styles.content}>
        {monthSections.map((month) => (
          <View key={month.id} style={styles.monthSection}>
            <Text style={styles.monthTitle}>{month.title}</Text>
            <View style={styles.logGrid}>
              {month.logs.map((log) => (
                <View key={log.id} style={[styles.logCard, { width: logCardWidth }]}>
                  <View style={styles.cardDate}>
                    <Text style={styles.cardDay}>{log.day}</Text>
                    <Text style={styles.cardWeekday}>{log.weekday}</Text>
                  </View>
                  <View style={styles.cardDetails}>
                    <Text style={styles.cardTitle}>{log.title}</Text>
                    <Text style={styles.cardTime}>{log.time}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    gap: 20,
    backgroundColor: screenBackgroundColor,
  },
  title: {
    paddingHorizontal: 20,
    fontFamily: headlineFontFamily,
    fontSize: 32,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: screenBackgroundColor,
  },
  content: {
    paddingHorizontal: contentPadding,
    paddingVertical: 20,
    gap: 20,
  },
  monthSection: {
    gap: 14,
    borderRadius: 8,
    padding: monthSectionPadding,
    backgroundColor: 'transparent',
  },
  monthTitle: {
    fontFamily: headlineFontFamily,
    fontSize: 22,
  },
  logGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: gridGap,
    backgroundColor: 'transparent',
  },
  logCard: {
    aspectRatio: 0.85,
    justifyContent: 'space-between',
    borderRadius: 8,
    padding: 14,
    backgroundColor: '#fff',
  },
  cardDate: {
    gap: 2,
    backgroundColor: 'transparent',
  },
  cardDay: {
    fontFamily: labelFontFamily,
    fontSize: 34,
  },
  cardWeekday: {
    fontFamily: labelFontFamily,
    fontSize: 14,
    color: '#6b7280',
  },
  cardDetails: {
    gap: 4,
    backgroundColor: 'transparent',
  },
  cardTitle: {
    fontFamily: bodyStrongFontFamily,
    fontSize: 16,
  },
  cardTime: {
    fontFamily: labelFontFamily,
    fontSize: 14,
    color: '#4b5563',
  },
});
