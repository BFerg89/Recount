import { View, StyleSheet, Text, ScrollView, Pressable } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { nightLogTheme } from '@/constants/NightLogTheme';
import { useLocalSearchParams, router } from 'expo-router';

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

function handleback() {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace('/(tabs)')
  }
}

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
  const people = log?.people;
  const moments = log?.timelineMoments;

  return (
    <View style={styles.screen}>
      <ScrollView>
        <View style={styles.content}>
          <View style={styles.header}>
            <Pressable
              style={({ pressed }) => [
                styles.backButton,
                pressed && styles.backButtonPressed,
              ]}
              onPress={handleback}>
              <SymbolView name={{
                ios: 'chevron.backward',
                android: 'chevron_backward'
              }}
              tintColor={colors.ink}
              size={35}/>
            </Pressable>
            <View style={styles.titleSection}>
              <Text style={styles.subTitle}>{weekday} · {monthTitle}</Text>
              <Text style={styles.title}>{log?.title}</Text>
              <Text style={styles.subTitle}>{log?.generalLocation}</Text>
            </View>
          </View>
          <View style={styles.peopleSection}>
            <Text style={styles.sectionLabel}>With · {log?.people.length} Friends</Text>
            <View style={styles.peopleGrid}>
              {people?.map((person) => (
                <View
                  key={person.id}
                  style={styles.person}
                >
                  <SymbolView name={{
                      ios: 'person.circle',
                      android: 'person',
                    }}
                    tintColor={colors.ink}
                  />
                  <Text style={styles.personText}>{person.displayName}</Text>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.timelineSection}>
            {moments?.map((moment) => (
              <Text
                key={moment.id}>{moment.title}</Text>
            ))}
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
  sectionLabel: {
    fontFamily: fonts.label,
    fontSize: type.label.fontSize,
    lineHeight: type.label.lineHeight,
    letterSpacing: type.label.letterSpacing,
    textTransform: type.label.textTransform,
    color: colors.inkMid,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
  },
  backButtonPressed: {
    backgroundColor: colors.paperEdge,
    boxShadow: shadows.press,
  },
  titleSection: {
    gap: spacing.s1,
    alignItems: 'flex-end',
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
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    gap: spacing.s3,
    paddingVertical: spacing.s2,
  },
  peopleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: spacing.s2,
    rowGap: spacing.s3,
  },
  person: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.paperCard,
    justifyContent: 'center',
    gap: spacing.s1,
    borderWidth: 1,
    borderColor: colors.paperEdge,
    borderRadius: radius.pill,
    paddingLeft: spacing.s1,
    paddingRight: spacing.s2,
    minHeight: 32,
  },
  personText: {
    fontFamily: fonts.label,
    fontSize: type.bodyS.fontSize,
    lineHeight: type.bodyS.lineHeight,
    color: colors.ink,
  },
  timelineSection: {
    borderWidth: 2,
    alignItems: 'center',
    gap: layout.verticalCardGap,
  }
});
