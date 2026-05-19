import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { nightLogTheme } from '@/constants/NightLogTheme';
import { logEntries, NightLogEntry } from '@/data/logEntries';

const { colors, fonts, layout, radius, shadows, spacing, type } = nightLogTheme;

const contentPadding = layout.mobileGutter;
const gridGap = layout.verticalCardGap;

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

const getCardRotation = (title: string) => {
  const rotations = ['-2deg', '-1deg', '-0.5deg', '0.5deg', '1deg', '2deg'];
  const charTotal = title.split('').reduce((total, char) => total + char.charCodeAt(0), 0);

  return rotations[charTotal % rotations.length];
};

export default function TabOneScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const logCardWidth = (width - contentPadding * 2 - gridGap) / 2;

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 12 }]}>
      <Text style={styles.title}>Nights</Text>
      <ScrollView style={styles.contentContainer} contentContainerStyle={styles.content}>
        {monthSections.map((month) => (
          <View key={month.id} style={styles.monthSection}>
            <Text style={styles.monthTitle}>{month.title}</Text>
            <View style={styles.logGrid}>
              {month.logs.map((log) => (
                <View 
                  key={log.id} 
                  style={[
                    styles.logCard,
                    { width: logCardWidth },
                    { transform: [{ rotate: getCardRotation(log.title) }] }
                  ]}>
                  <View style={styles.cardDate}>
                    <Text style={styles.cardDay}>{log.day}</Text>
                    <Text style={styles.cardWeekday}>{log.weekday}</Text>
                  </View>
                  <View style={styles.cardDetails}>
                    <Text style={styles.cardTitle}>{log.title}</Text>
                    <Text style={styles.cardLocation}>{log.location}</Text>
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
    gap: spacing.s3,
    backgroundColor: colors.paper,
  },
  title: {
    paddingHorizontal: layout.mobileGutter,
    fontFamily: fonts.display,
    fontSize: type.displayM.fontSize,
    lineHeight: type.displayM.lineHeight,
    letterSpacing: type.displayM.letterSpacing,
    color: colors.terracotta,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: contentPadding,
    paddingBottom: spacing.s7,
    gap: layout.sectionSpacing,
  },
  monthSection: {
    gap: layout.verticalCardGap,
  },
  monthTitle: {
    fontFamily: fonts.display,
    fontSize: type.displayS.fontSize,
    lineHeight: type.displayS.lineHeight,
    letterSpacing: type.displayS.letterSpacing,
    color: colors.ink,
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
    borderRadius: radius.l,
    borderWidth: 1,
    borderColor: colors.paperEdge,
    padding: layout.cardPadding,
    backgroundColor: colors.paperCard,
    boxShadow: shadows.card,
  },
  cardDate: {
    gap: spacing.s1,
    backgroundColor: 'transparent',
  },
  cardDay: {
    fontFamily: fonts.display,
    fontSize: type.numeral.fontSize,
    lineHeight: type.numeral.lineHeight,
    fontVariant: ['tabular-nums'],
    color: colors.ink,
  },
  cardWeekday: {
    fontFamily: fonts.label,
    fontSize: type.label.fontSize,
    lineHeight: type.label.lineHeight,
    letterSpacing: type.label.letterSpacing,
    textTransform: type.label.textTransform,
    color: colors.inkSoft,
  },
  cardDetails: {
    gap: spacing.s1,
    backgroundColor: 'transparent',
  },
  cardTitle: {
    fontFamily: fonts.display,
    fontSize: type.displayS.fontSize,
    lineHeight: type.displayS.lineHeight,
    letterSpacing: type.displayS.letterSpacing,
    color: colors.ink,
  },
  cardLocation: {
    fontFamily: fonts.body,
    fontSize: type.bodyS.fontSize,
    lineHeight: type.bodyS.lineHeight,
    color: colors.inkMid,
  },
});
