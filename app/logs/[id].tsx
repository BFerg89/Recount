import { useEffect, useState } from 'react';
import { View, StyleSheet, Text, ScrollView, Pressable, useWindowDimensions } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { recountTheme } from '@/constants/RecountTheme';
import { useLocalSearchParams, router } from 'expo-router';

import { PersonPill } from '@/components/people/PersonPill';
import { parseStoredDate } from '@/features/logs/logDate';
import { fetchLogById } from '@/features/logs/logsApi';
import type { LogEntry } from '@/features/logs/logTypes';
import { promptedNoteDefinitions } from '@/features/logs/promptedNotes';

const { colors, fonts, layout, radius, shadows, spacing, type } = recountTheme;
const gridGap = spacing.s4;

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
  const { width } = useWindowDimensions();
  const noteCardWidth = Math.min(
    336,
    Math.max(292, width - layout.mobileGutter * 2 - spacing.s6)
  ) / 2.2;

  const selectedLogId = Array.isArray(id) ? id[0] : id;
  const [log, setLog] = useState<LogEntry | null>(null);
  const [isLogLoading, setIsLogLoading] = useState(true);
  const [logError, setLogError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadLog() {
      if (!selectedLogId) {
        setLog(null);
        setLogError('Log not found.');
        setIsLogLoading(false);
        return;
      }

      setIsLogLoading(true);
      setLog(null);
      setLogError(null);

      try {
        const fetchedLog = await fetchLogById(selectedLogId);

        if (!isActive) {
          return;
        }

        setLog(fetchedLog);
        setLogError(fetchedLog ? null : 'Log not found.');
      } catch {
        if (!isActive) {
          return;
        }

        setLog(null);
        setLogError('Unable to load this log.');
      } finally {
        if (isActive) {
          setIsLogLoading(false);
        }
      }
    }

    void loadLog();

    return () => {
      isActive = false;
    };
  }, [selectedLogId]);

  const date = log ? parseStoredDate(log.date) : null;
  const weekday = date?.toLocaleDateString('en-US', { weekday: 'long' });
  const monthTitle = date?.toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  })
  const people = log?.people;
  const moments = log
    ? [...log.timelineEvents].sort((a, b) => a.sortOrder - b.sortOrder)
    : [];
  const promptLabels = Object.fromEntries(
    promptedNoteDefinitions.map((prompt) => [prompt.promptType, prompt.label])
  );
  const answeredNotes = log?.notes
    .filter((note) => note.text.trim().length > 0)
    .map((note) => ({
      ...note,
      label: promptLabels[note.promptType] ?? 'Note:',
    })) ?? [];
  const noteColumns = Array.from(
    { length: Math.ceil(answeredNotes.length / 2) },
    (_, index) => answeredNotes.slice(index * 2, index * 2 + 2)
  );
  const dateLine = weekday && monthTitle ? `${weekday} · ${monthTitle}` : '';
  const titleText = log?.title ?? (isLogLoading ? 'Loading...' : 'Log unavailable');
  const stateMessage = isLogLoading ? 'Loading log...' : logError ?? 'Log not found.';

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: spacing.s8 },
        ]}>
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
              <Text style={styles.subTitle}>{dateLine}</Text>
              <Text
                style={styles.title}
                numberOfLines={2}
                ellipsizeMode="tail">
                {titleText}
              </Text>
              <Text style={styles.subTitle}>{log?.generalLocation}</Text>
            </View>
          </View>
          {!log ? (
            <View style={styles.stateSection}>
              <Text style={styles.stateText}>{stateMessage}</Text>
            </View>
          ) : (
            <>
              <View style={styles.peopleSection}>
                <Text style={styles.sectionLabel}>With · {log.people.length} Friends</Text>
                <View style={styles.peopleGrid}>
                  {people?.map((person) => (
                    <PersonPill
                      key={person.id}
                      displayName={person.displayName}
                    />
                  ))}
                </View>
              </View>
              <View style={styles.timelineSection}>
                <View style={styles.timelineHeader}>
                  <Text style={styles.sectionLabel}>Moments</Text>
                  <Text style={styles.sectionLabel}>{moments.length} added</Text>
                </View>
                <View style={styles.momentListCard}>
                  {moments.map((moment) => (
                    <View
                      key={moment.id}
                      style={styles.momentRow}>
                      <Text style={styles.momentTime}>{moment.approxTime}</Text>
                      <Text style={styles.momentTitle}>{moment.title}</Text>
                    </View>
                  ))}
                </View>
              </View>
              {answeredNotes.length > 0 && (
                <View style={styles.notesSection}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.noteCardsScroll}
                    contentContainerStyle={styles.noteCardsContent}>
                    {noteColumns.map((column) => (
                      <View
                        key={column.map((note) => note.id).join('-')}
                        style={styles.noteColumn}>
                        {column.map((note) => (
                          <View key={note.id} style={[styles.noteCard, { width: noteCardWidth }]}>
                            <Text style={styles.notePrompt}>{note.label}</Text>
                            <Text style={styles.noteAnswer}>{note.text}</Text>
                          </View>
                        ))}
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}
            </>
          )}
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
  scrollContent: {
    flexGrow: 1,
  },
  sectionLabel: {
    fontFamily: fonts.label,
    fontSize: type.label.fontSize,
    lineHeight: type.label.lineHeight,
    letterSpacing: type.label.letterSpacing,
    textTransform: type.label.textTransform,
    color: colors.inkMid,
  },
  stateSection: {
    minHeight: 160,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.s6,
  },
  stateText: {
    fontFamily: fonts.bodyStrong,
    fontSize: type.body.fontSize,
    lineHeight: type.body.lineHeight,
    color: colors.inkMid,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s3,
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
    flex: 1,
    minWidth: 0,
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
    alignSelf: 'stretch',
    fontFamily: fonts.display,
    fontSize: type.displayXl.fontSize,
    letterSpacing: type.displayXl.letterSpacing,
    textAlign: 'right',
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
  timelineSection: {
    minHeight: 104,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    gap: spacing.s3,
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  momentListCard: {
    width: '100%',
    backgroundColor: colors.paperCard,
    borderWidth: 1,
    borderColor: colors.paperEdge,
    borderRadius: radius.m,
    padding: layout.cardPadding,
  },
  momentRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.s4,
    borderBottomWidth: 1,
    borderBottomColor: colors.rule,
    paddingVertical: spacing.s1,
  },
  momentTitle: {
    fontFamily: fonts.italicAccent,
    fontSize: type.bodyL.fontSize,
    lineHeight: type.bodyL.lineHeight,
    color: colors.ink,
    flex: 1,
  },
  momentTime: {
    fontFamily: fonts.bodyStrong,
    fontSize: type.bodyS.fontSize,
    fontVariant: ['tabular-nums'],
    color: colors.inkSoft,
    width: 64,
  },
  notesSection: {
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    minHeight: 360,
  },
  noteCardsScroll: {
    flex: 1,
  },
  noteCardsContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: gridGap,
  },
  noteColumn: {
    gap: gridGap,
  },
  noteCard: {
    minHeight: 172,
    borderRadius: radius.l,
    borderWidth: 1,
    borderColor: colors.paperEdge,
    padding: layout.cardPadding,
    backgroundColor: colors.paperCard,
  },
  notePrompt: {
    fontFamily: fonts.bodyStrong,
    fontSize: type.bodyL.fontSize,
    color: colors.inkMid,
  },
  noteAnswer: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: type.body.fontSize,
    lineHeight: type.body.lineHeight,
    color: colors.ink,
    paddingVertical: spacing.s2,
  },
});
