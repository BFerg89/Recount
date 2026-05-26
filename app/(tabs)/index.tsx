import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { recountTheme } from '@/constants/RecountTheme';
import { useLogs } from '@/context/LogsContext';
import { parseStoredDate, type LogEntry } from '@/data/logModels';

const { colors, fonts, layout, radius, shadows, spacing, type } = recountTheme;

const contentPadding = layout.mobileGutter;
const gridGap = layout.verticalCardGap;

// Turns the stored date into the display pieces each log card needs.
const formatLogDate = (date: Date) => {
  return {
    day: String(date.getDate()).padStart(2, '0'),
    weekday: date.toLocaleDateString('en-US', { weekday: 'short' }),
    monthTitle: date.toLocaleDateString('en-US', { 
      month: 'short',
      year: 'numeric',
    })
  };
};

const getCardRotation = (title: string) => {
  const rotations = ['-2deg', '-1deg', '-0.5deg', '0.5deg', '1deg', '2deg'];
  const charTotal = title.split('').reduce((total, char) => total + char.charCodeAt(0), 0);

  return rotations[charTotal % rotations.length];
};

export default function TabOneScreen() {
  const { logs } = useLogs();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const logCardWidth = (width - contentPadding * 2 - gridGap) / 2;
  const monthSections = Object.values(
    [...logs]
    .sort((a, b) => parseStoredDate(b.date).getTime() - parseStoredDate(a.date).getTime())
    .reduce<Record<string, {
      id: string;
      title: string;
      logs: Array<LogEntry & ReturnType<typeof formatLogDate>>;
    }>>((sections, log) => {
      const formattedDate = formatLogDate(parseStoredDate(log.date));
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

  const router = useRouter();

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Logs</Text>
      <ScrollView style={styles.contentContainer} contentContainerStyle={styles.content}>
        {monthSections.map((month) => (
          <View key={month.id} style={styles.monthSection}>
            <Text style={styles.monthTitle}>{month.title}</Text>
            <View style={styles.logGrid}>
              {month.logs.map((log) => (
                <Pressable 
                  key={log.id}
                  onPress={() => router.push(`/logs/${log.id}`)}
                  style={({ pressed }) => [
                    styles.logCard,
                    pressed && styles.logCardPressed,
                    { width: logCardWidth },
                    { transform: [{ rotate: getCardRotation(log.title) }] }
                  ]}>
                  <View style={styles.cardDate}>
                    <Text style={styles.cardDay}>{log.day}</Text>
                    <Text style={styles.cardWeekday}>{log.weekday}</Text>
                  </View>
                  <View style={styles.cardDetails}>
                    <Text style={styles.cardTitle}>{log.title}</Text>
                    <Text style={styles.cardLocation}>{log.generalLocation}</Text>
                  </View>
                </Pressable>
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
    paddingTop: layout.statusBarSpace,
  },
  title: {
    paddingHorizontal: layout.mobileGutter,
    fontFamily: fonts.display,
    fontSize: type.displayXl.fontSize,
    letterSpacing: type.displayXl.letterSpacing,
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
  logCardPressed: {
    backgroundColor: colors.paperEdge,
    boxShadow: shadows.press,
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
