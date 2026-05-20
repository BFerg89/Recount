import { View, StyleSheet, Text, ScrollView } from 'react-native';
import { nightLogTheme } from '@/constants/NightLogTheme';
import { useLocalSearchParams } from 'expo-router';

import { useNightLogs } from '@/context/NightLogsContext';
import { MonoText } from '@/components/StyledText';

const { colors, fonts, layout, radius, shadows, spacing, type } = nightLogTheme;

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

export default function ViewLogScreen() {
  const { id } = useLocalSearchParams();
  const { nightLogs } = useNightLogs();

  const selectedLogId = Array.isArray(id) ? id[0] : id;
  const log = nightLogs.find((nightLog) => nightLog.id === selectedLogId);

  const date = log?.date;
  const weekday = date?.toLocaleDateString('en-US', { weekday: 'long' });
  const monthTitle = date?.toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  })

  return (
    <View style={styles.screen}>
      <ScrollView>
        <View style={styles.content}>
          <View style={styles.titleSection}>
            <Text style={styles.subTitle}>{weekday} · {monthTitle}</Text>
            <Text style={styles.title}>{log?.title}</Text>
            <Text style={styles.subTitle}>{log?.generalLocation}</Text>
          </View>
          <View style={styles.peopleSection}>
            <Text>Test</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.paper,
    paddingHorizontal: layout.mobileGutter,
    paddingTop: layout.statusBarSpace,
  },
  content: {
    gap: layout.sectionSpacing,
  },
  titleSection: {
    gap: spacing.s1,
    alignItems: 'flex-end',
    borderWidth: 2,
  },
  subTitle: {
    fontFamily: fonts.label,
    fontSize: type.label.fontSize,
    letterSpacing: type.label.letterSpacing,
    textTransform: type.label.textTransform,
    color: colors.terracottaDeep,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: type.displayXl.fontSize,
    letterSpacing: type.displayXl.letterSpacing,
    color: colors.ink,
  },
  peopleSection: {
    borderWidth: 2,
  }
});