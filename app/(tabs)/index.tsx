import { ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text, View } from '@/components/Themed';
import { logEntries, NightLogEntry } from '@/data/logEntries';

const contentPadding = 20;
const monthSectionPadding = 16;
const gridGap = 12;
const screenBackgroundColor = '#F5F2EA';
const headlineFontFamily = 'Newsreader_700Bold';
const bodyFontFamily = 'BeVietnamPro_400Regular';
const bodyStrongFontFamily = 'BeVietnamPro_600SemiBold';
const labelFontFamily = 'SplineSans_500Medium';


// Turns the stored date string into the display pieces each log card needs.
const formatLogDate = (date: string) => {
  const [year, month, day] = date.split('-').map(Number);
  const localDate = new Date(year, month - 1, day);

  return {
    day: String(day).padStart(2, '0'),
    weekday: localDate.toLocaleDateString('en-US', { weekday: 'short' }),
    monthTitle: localDate.toLocaleDateString('en-US', { 
      month: 'short',
      year: 'numeric',
    })
  };
};

// Takes the raw log entries, sorts newest first, formats their dates,
// then groups them into month sections for the screen to render.
const monthSections = Object.values(
  [...logEntries]
  .sort((a, b) => b.date.localeCompare(a.date))
  .reduce<Record<string, {
    id: string;
    title: string;
    logs: Array<NightLogEntry & ReturnType<typeof formatLogDate>>;
  }>>((sections, log) => {
    const formattedDate = formatLogDate(log.date);
    const sectionId = formattedDate.monthTitle.toLowerCase().replace(' ', '-');

    if (!sections[sectionId]) {
      sections[sectionId] = {
        id: sectionId,
        title: formattedDate.monthTitle,
        logs: [],
      };
    }

    sections[sectionId].logs.push({
      ...log,
      ...formattedDate,
    });

    return sections;
  }, {})
);

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
