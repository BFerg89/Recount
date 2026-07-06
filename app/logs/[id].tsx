import { useEffect, useState } from 'react';
import { Alert, View, StyleSheet, Text, ScrollView, Pressable, useWindowDimensions } from 'react-native';
import { ArrowLeftIcon, NotePencilIcon, TrashSimpleIcon } from 'phosphor-react-native';
import { recountTheme } from '@/constants/RecountTheme';
import { useLocalSearchParams, router } from 'expo-router';

import { PersonPill } from '@/components/people/PersonPill';
import { useAuth } from '@/context/AuthContext';
import { useLogs } from '@/context/LogsContext';
import { parseStoredDate } from '@/features/logs/logDate';
import type { LogEntry } from '@/features/logs/logTypes';
import { promptedNoteDefinitions } from '@/features/logs/promptedNotes';

const { colors, fonts, layout, radius, shadows, spacing, type } = recountTheme;
const gridGap = spacing.s4;
const noteCardMinHeight = 172;
const noteRailTopPadding = spacing.s3;
const noteRailBottomPadding = spacing.s7;
const noteRailVerticalPadding = noteRailTopPadding + noteRailBottomPadding;
const noteRailMinHeight = noteCardMinHeight * 2 + gridGap + noteRailVerticalPadding;

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
  const { user } = useAuth();
  const { deleteLog, leaveLog, loadLog } = useLogs();
  const { width } = useWindowDimensions();
  const noteCardWidth = Math.min(
    336,
    Math.max(292, width - layout.mobileGutter * 2 - spacing.s6)
  ) / 2.2;

  const selectedLogId = Array.isArray(id) ? id[0] : id;
  const [log, setLog] = useState<LogEntry | null>(null);
  const [isLogLoading, setIsLogLoading] = useState(true);
  const [logError, setLogError] = useState<string | null>(null);
  const [isDeletingLog, setIsDeletingLog] = useState(false);
  const [isLeavingLog, setIsLeavingLog] = useState(false);

  const confirmLeaveLog = async () => {
    if (!selectedLogId || isLeavingLog) {
      return;
    }

    setIsLeavingLog(true);

    try {
      await leaveLog(selectedLogId);
      handleback();
    } catch (caughtError) {
      const message = caughtError instanceof Error
        ? caughtError.message
        : 'Could not leave log.';

      Alert.alert('Could not leave log', message);
    } finally {
      setIsLeavingLog(false);
    }
  };

  const confirmDeleteLog = async () => {
    if (!selectedLogId || isDeletingLog) {
      return;
    }

    setIsDeletingLog(true);

    try {
      await deleteLog(selectedLogId);
      handleback();
    } catch (caughtError) {
      const message = caughtError instanceof Error
        ? caughtError.message
        : 'Could not delete log.';

      Alert.alert('Could not delete log', message);
    } finally {
      setIsDeletingLog(false);
    }
  };

  const handleLeaveLogPress = () => {
    if (!selectedLogId || isLeavingLog) {
      return;
    }

    Alert.alert(
      'Leave log?',
      'This removes your access this log and cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Leave log',
          style: 'destructive',
          onPress: () => {
            void confirmLeaveLog();
          },
        },
      ],
      { cancelable: true }
    );
  }

  const handleDeleteLogPress = () => {
    if (!selectedLogId || isDeletingLog) {
      return;
    }

    Alert.alert(
      'Delete log?',
      'This permanently deletes this log and cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete log',
          style: 'destructive',
          onPress: () => {
            void confirmDeleteLog();
          },
        },
      ],
      { cancelable: true }
    );
  };

  useEffect(() => {
    let isActive = true;

    async function loadSelectedLog() {
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
        const fetchedLog = await loadLog(selectedLogId);

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

    void loadSelectedLog();

    return () => {
      isActive = false;
    };
  }, [selectedLogId, loadLog]);

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
  const currentUserId = user?.id;
  const isLogCreator = Boolean(log && currentUserId && log.creatorId === currentUserId);

  return (
    <View testID="screen-log-detail" style={styles.screen}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Pressable
              testID="log-detail-back-button"
              style={({ pressed }) => [
                styles.backButton,
                pressed && styles.backButtonPressed,
              ]}
              onPress={handleback}>
              <ArrowLeftIcon color={colors.ink} size={28} />
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
            <View testID="log-detail-state" style={styles.stateSection}>
              <Text testID="log-detail-state-text" style={styles.stateText}>{stateMessage}</Text>
            </View>
          ) : (
            <>
              <View style={styles.peopleSection}>
                <Text style={styles.sectionLabel}>With · {log.people.length} Friends</Text>
                <View style={styles.peopleGrid}>
                  {people?.map((person) => (
                    <PersonPill
                      key={person.id}
                      testID={`log-detail-person-pill-${person.id}`}
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
                      testID={`log-detail-moment-row-${moment.id}`}
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
                          <View
                            key={note.id}
                            testID={`log-detail-note-card-${note.id}`}
                            style={[styles.noteCard, { width: noteCardWidth }]}>
                            <Text style={styles.notePrompt}>{note.label}</Text>
                            <Text style={styles.noteAnswer}>{note.text}</Text>
                          </View>
                        ))}
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}
              <View style={styles.logActionsSection}>
                <Pressable
                  testID="log-detail-edit-button"
                  accessibilityLabel="Edit log"
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.editLogButton,
                    pressed && styles.editLogButtonPressed,
                  ]}
                  onPress={() => router.push(`/logs/${selectedLogId}/edit`)}>
                  <NotePencilIcon color={colors.terracottaDeep} size={16} />
                  <Text style={styles.editLogButtonText}>Edit log</Text>
                </Pressable>
                {isLogCreator ? (
                  <Pressable
                    testID="log-detail-delete-button"
                    accessibilityLabel="Delete log"
                    accessibilityRole="button"
                    accessibilityState={{ disabled: isDeletingLog }}
                    disabled={isDeletingLog}
                    style={({ pressed }) => [
                      styles.deleteLogButton,
                      pressed && styles.deleteLogButtonPressed,
                      isDeletingLog && styles.deleteLogButtonDisabled,
                    ]}
                    onPress={handleDeleteLogPress}>
                    <TrashSimpleIcon color={colors.paperCard} size={16} weight="bold" />
                    <Text style={styles.deleteLogButtonText}>
                      {isDeletingLog ? 'Deleting...' : 'Delete log'}
                    </Text>
                  </Pressable>
                ) : (
                  <Pressable
                    testID="log-detail-leave-button"
                    accessibilityLabel="Leave log"
                    accessibilityRole="button"
                    accessibilityState={{ disabled: isLeavingLog }}
                    disabled={isLeavingLog}
                    style={({ pressed }) => [
                      styles.deleteLogButton,
                      pressed && styles.deleteLogButtonPressed,
                      isLeavingLog && styles.deleteLogButtonDisabled,
                    ]}
                    onPress={handleLeaveLogPress}>
                    <TrashSimpleIcon color={colors.paperCard} size={16} weight="bold" />
                    <Text style={styles.deleteLogButtonText}>
                      {isLeavingLog ? 'Leaving...' : 'Leave log'}
                    </Text>
                  </Pressable>
                )}
              </View>
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
  },
  scrollView: {
    flex: 1,
  },
  content: {
    gap: layout.sectionSpacing,
    paddingHorizontal: layout.mobileGutter,
    paddingTop: layout.statusBarSpace,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.s8,
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
    minHeight: noteRailMinHeight,
    marginHorizontal: -layout.mobileGutter,
    marginBottom: -noteRailVerticalPadding,
  },
  noteCardsScroll: {
    flex: 1,
  },
  noteCardsContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: gridGap,
    paddingHorizontal: layout.mobileGutter,
    paddingTop: noteRailTopPadding,
    paddingBottom: noteRailBottomPadding,
  },
  noteColumn: {
    gap: gridGap,
  },
  noteCard: {
    minHeight: noteCardMinHeight,
    borderRadius: radius.l,
    borderWidth: 1,
    borderColor: colors.paperEdge,
    padding: layout.cardPadding,
    backgroundColor: colors.paperCard,
    boxShadow: shadows.card,
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
  logActionsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s2,
  },
  editLogButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.rule,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s2,
    backgroundColor: colors.paperCard,
    boxShadow: shadows.card,
  },
  editLogButtonPressed: {
    backgroundColor: colors.paperEdge,
    boxShadow: shadows.press,
    transform: [{ scale: 0.99 }],
  },
  editLogButtonText: {
    fontFamily: fonts.bodyStrong,
    fontSize: type.body.fontSize,
    lineHeight: type.body.lineHeight,
    color: colors.terracottaDeep,
  },
  deleteLogButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s2,
    backgroundColor: colors.terracotta,
  },
  deleteLogButtonPressed: {
    backgroundColor: colors.terracottaDeep,
  },
  deleteLogButtonDisabled: {
    opacity: 0.65,
  },
  deleteLogButtonText: {
    fontFamily: fonts.bodyStrong,
    fontSize: type.body.fontSize,
    lineHeight: type.body.lineHeight,
    color: colors.paperCard,
  },
});
