import DateTimePicker from '@expo/ui/datetimepicker';
import BottomSheet from '@gorhom/bottom-sheet';
import { ArrowLeftIcon, PathIcon, TrayArrowDownIcon, UserPlusIcon } from 'phosphor-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';

import { AddMomentSheet } from '@/components/create/AddMomentSheet';
import { AddPersonSheet, type AddPersonFriend } from '@/components/create/AddPersonSheet';
import { EditMomentSheet } from '@/components/create/EditMomentSheet';
import { PersonPill } from '@/components/people/PersonPill';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { inputLimits } from '@/constants/input-limits';
import { recountTheme } from '@/constants/RecountTheme';
import { useAuth } from '@/context/AuthContext';
import { useLogs } from '@/context/LogsContext';
import { parseStoredDate } from '@/features/logs/logDate';
import { createEmptyPromptedNoteAnswers, promptedNoteDefinitions } from '@/features/logs/promptedNotes';
import type { CreatePersonInput, CreateTimelineEventInput, LogEntry } from '@/features/logs/logTypes';

const { colors, fonts, layout, radius, shadows, spacing, type } = recountTheme;

const gridGap = spacing.s4;
const noteCardMinHeight = 172;
const noteRailTopPadding = spacing.s3;
const noteRailBottomPadding = spacing.s7;
const noteRailVerticalPadding = noteRailTopPadding + noteRailBottomPadding;
const noteRailMinHeight = noteCardMinHeight * 2 + gridGap + noteRailVerticalPadding;
const friendPersonIdPrefix = 'friend-profile-';
const localTimelineEventIdPrefix = 'local-timeline-event-';

const getFriendPersonId = (profileId: string) => `${friendPersonIdPrefix}${profileId}`;

const getLogPeopleDraft = (log: LogEntry): CreatePersonInput[] => {
  return log.people.map((person) => ({
    id: person.id,
    displayName: person.displayName,
    userId: person.userId,
  }));
};

const getLogMomentsDraft = (log: LogEntry): CreateTimelineEventInput[] => {
  return [...log.timelineEvents]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((moment) => ({
      id: moment.id,
      title: moment.title,
      approxTime: moment.approxTime,
    }));
};

const getLogNoteAnswersDraft = (log: LogEntry) => {
  const noteAnswers = createEmptyPromptedNoteAnswers();

  log.notes.forEach((note) => {
    noteAnswers[note.promptType] = note.text;
  });

  return noteAnswers;
};

function handleBack() {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace('/(tabs)');
  }
}

export default function EditLogScreen() {
  const { id } = useLocalSearchParams();
  const selectedLogId = Array.isArray(id) ? id[0] : id;
  const { user } = useAuth();
  const { getCachedLog, loadLog, updateLog } = useLogs();
  const initialCachedLog = selectedLogId ? getCachedLog(selectedLogId) : null;
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const noteCardWidth = Math.min(
    336,
    Math.max(292, width - layout.mobileGutter * 2 - spacing.s6)
  ) / 2.2;
  const notePromptColumns = Array.from(
    { length: Math.ceil(promptedNoteDefinitions.length / 2) },
    (_, index) => promptedNoteDefinitions.slice(index * 2, index * 2 + 2)
  );

  const [date, setDate] = useState(() =>
    initialCachedLog ? parseStoredDate(initialCachedLog.date) : new Date()
  );
  const [title, setTitle] = useState(() => initialCachedLog?.title ?? '');
  const [location, setLocation] = useState(() => initialCachedLog?.generalLocation ?? '');
  const [noteAnswers, setNoteAnswers] = useState(() =>
    initialCachedLog ? getLogNoteAnswersDraft(initialCachedLog) : createEmptyPromptedNoteAnswers()
  );
  const [people, setPeople] = useState<CreatePersonInput[]>(() =>
    initialCachedLog ? getLogPeopleDraft(initialCachedLog) : []
  );
  const [newPersonName, setNewPersonName] = useState('');
  const [moments, setMoments] = useState<CreateTimelineEventInput[]>(() =>
    initialCachedLog ? getLogMomentsDraft(initialCachedLog) : []
  );
  const [deletedMomentIds, setDeletedMomentIds] = useState<string[]>([]);
  const [newMomentTitle, setNewMomentTitle] = useState('');
  const [newMomentTime, setNewMomentTime] = useState('');
  const [editingMomentId, setEditingMomentId] = useState<string | null>(null);
  const [editMomentTitle, setEditMomentTitle] = useState('');
  const [editMomentTime, setEditMomentTime] = useState('');
  const [isLogLoading, setIsLogLoading] = useState(() => Boolean(selectedLogId && !initialCachedLog));
  const [logError, setLogError] = useState<string | null>(() => selectedLogId ? null : 'Log not found.');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [log, setLog] = useState<LogEntry | null>(() => initialCachedLog);

  const addPeopleSheetRef = useRef<BottomSheet>(null);
  const addMomentSheetRef = useRef<BottomSheet>(null);
  const editMomentSheetRef = useRef<BottomSheet>(null);
  const scrollRef = useRef<ScrollView>(null);
  const locationInputRef = useRef<TextInput>(null);
  const hydratedLogIdRef = useRef<string | null>(initialCachedLog?.id ?? null);

  const acceptedFriends = useMemo<AddPersonFriend[]>(() => [], []);
  const addedFriendIds = useMemo(() => {
    return people.reduce<string[]>((selectedFriendIds, person) => {
      if (person.id.startsWith(friendPersonIdPrefix)) {
        selectedFriendIds.push(person.id.slice(friendPersonIdPrefix.length));
      }

      return selectedFriendIds;
    }, []);
  }, [people]);

  const clearSaveError = () => {
    if (saveError) {
      setSaveError(null);
    }
  };

  const canSaveChanges =
    title.trim().length > 0 &&
    location.trim().length > 0 &&
    !isLogLoading &&
    !logError &&
    !isSaving;
  const currentUserId = user?.id;
  const isLogCreator = Boolean(log && currentUserId && log.creatorId === currentUserId);

  const hydrateLogDraft = useCallback((hydratedLog: LogEntry) => {
    setLog(hydratedLog);
    setDate(parseStoredDate(hydratedLog.date));
    setTitle(hydratedLog.title);
    setLocation(hydratedLog.generalLocation);
    setPeople(getLogPeopleDraft(hydratedLog));
    setMoments(getLogMomentsDraft(hydratedLog));
    setDeletedMomentIds([]);
    setNoteAnswers(getLogNoteAnswersDraft(hydratedLog));
    setSaveError(null);
  }, []);

  useEffect(() => {
    let isActive = true;

    async function loadLogDraft() {
      if (!selectedLogId) {
        hydratedLogIdRef.current = null;
        setLog(null);
        setLogError('Log not found.');
        setIsLogLoading(false);
        return;
      }

      if (hydratedLogIdRef.current === selectedLogId) {
        return;
      }

      const cachedLog = getCachedLog(selectedLogId);

      if (cachedLog) {
        hydrateLogDraft(cachedLog);
        hydratedLogIdRef.current = cachedLog.id;
        setLogError(null);
        setIsLogLoading(false);
        return;
      }

      setIsLogLoading(true);
      setLogError(null);

      try {
        const fetchedLog = await loadLog(selectedLogId);

        if (!isActive) {
          return;
        }

        if (!fetchedLog) {
          hydratedLogIdRef.current = null;
          setLog(null);
          setLogError('Log not found.');
          return;
        }

        hydrateLogDraft(fetchedLog);
        hydratedLogIdRef.current = fetchedLog.id;
      } catch {
        if (isActive) {
          hydratedLogIdRef.current = null;
          setLog(null);
          setLogError('Unable to load this log.');
        }
      } finally {
        if (isActive) {
          setIsLogLoading(false);
        }
      }
    }

    void loadLogDraft();

    return () => {
      isActive = false;
    };
  }, [getCachedLog, hydrateLogDraft, loadLog, selectedLogId]);

  const handleNoteFocus = () => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 0);
  };

  const handleOpenAddPeopleSheet = () => {
    Keyboard.dismiss();
    addPeopleSheetRef.current?.expand();
  };

  const handleOpenEditMomentSheet = (moment: CreateTimelineEventInput) => {
    setEditingMomentId(moment.id);
    setEditMomentTitle(moment.title);
    setEditMomentTime(moment.approxTime ?? '');

    Keyboard.dismiss();
    editMomentSheetRef.current?.expand();
  };

  const handleOpenAddMomentSheet = () => {
    Keyboard.dismiss();
    addMomentSheetRef.current?.expand();
  };

  const handleAddPerson = () => {
    const trimmedName = newPersonName.trim();

    if (!trimmedName) {
      return;
    }

    const newPerson: CreatePersonInput = {
      id: `local-person-${Date.now()}`,
      displayName: trimmedName,
    };

    Keyboard.dismiss();
    setPeople((currentPeople) => [...currentPeople, newPerson]);
    clearSaveError();
    setNewPersonName('');
    addPeopleSheetRef.current?.close();
  };

  const handleAddFriendPerson = (friend: AddPersonFriend) => {
    const personId = getFriendPersonId(friend.id);

    Keyboard.dismiss();
    setPeople((currentPeople) => {
      const isAlreadyAdded = currentPeople.some((person) => person.id === personId);

      if (isAlreadyAdded) {
        return currentPeople;
      }

      return [
        ...currentPeople,
        {
          id: personId,
          displayName: friend.displayName.trim() || friend.username,
          userId: friend.id,
        },
      ];
    });
    clearSaveError();
    addPeopleSheetRef.current?.close();
  };

  const clearEditMomentDraft = () => {
    setEditingMomentId(null);
    setEditMomentTitle('');
    setEditMomentTime('');
    editMomentSheetRef.current?.close();
  };

  const handleSaveMoment = () => {
    const trimmedTitle = editMomentTitle.trim();
    const trimmedTime = editMomentTime.trim();

    if (!editingMomentId || !trimmedTitle) {
      return;
    }

    setMoments((currentMoments) =>
      currentMoments.map((moment) =>
        moment.id === editingMomentId
          ? {
            ...moment,
            title: trimmedTitle,
            approxTime: trimmedTime || null,
          }
          : moment
      )
    );

    clearSaveError();
    Keyboard.dismiss();
    clearEditMomentDraft();
  };

  const deleteEditingMoment = () => {
    if (!editingMomentId) {
      return;
    }

    const momentIdToDelete = editingMomentId;

    setMoments((currentMoments) =>
      currentMoments.filter((moment) => moment.id !== momentIdToDelete)
    );

    if (!momentIdToDelete.startsWith(localTimelineEventIdPrefix)) {
      setDeletedMomentIds((currentDeletedMomentIds) =>
        currentDeletedMomentIds.includes(momentIdToDelete)
          ? currentDeletedMomentIds
          : [...currentDeletedMomentIds, momentIdToDelete]
      );
    }

    clearSaveError();
    Keyboard.dismiss();
    clearEditMomentDraft();
  };

  const handleDeleteMoment = () => {
    if (!editingMomentId) {
      return;
    }

    Alert.alert(
      'Delete moment?',
      'This removes the moment from this draft. Publish changes to save the deletion.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete moment',
          style: 'destructive',
          onPress: deleteEditingMoment,
        },
      ],
      { cancelable: true }
    );
  };

  const handleAddMoment = () => {
    const trimmedTitle = newMomentTitle.trim();
    const trimmedTime = newMomentTime.trim();

    if (!trimmedTitle) {
      return;
    }

    const newMoment: CreateTimelineEventInput = {
      id: `local-timeline-event-${Date.now()}`,
      title: trimmedTitle,
      approxTime: trimmedTime || null,
    };

    Keyboard.dismiss();
    setMoments((currentMoments) => [...currentMoments, newMoment]);
    clearSaveError();
    setNewMomentTitle('');
    setNewMomentTime('');
    addMomentSheetRef.current?.close();
  };

  const handleSaveChanges = async () => {
    if (!selectedLogId) {
      setSaveError('Log not found.');
      return;
    }

    if (!canSaveChanges) {
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const updatedLog = await updateLog({
        id: selectedLogId,
        title,
        date,
        generalLocation: location,
        moments,
        deletedMomentIds,
        noteAnswers,
      });
      hydrateLogDraft(updatedLog);
      router.replace(`/logs/${updatedLog.id}`);
    } catch (caughtError) {
      setSaveError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to save changes.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        automaticallyAdjustKeyboardInsets
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View
          accessible={false}
          onResponderRelease={Keyboard.dismiss}
          onStartShouldSetResponder={(event) => event.target === event.currentTarget}
          style={[
            styles.content,
            {
              paddingTop: insets.top + spacing.s3,
              paddingBottom: spacing.s8,
            },
          ]}>
          <View style={styles.headerSection}>
            <View style={styles.headerRow}>
              <Pressable
                accessibilityLabel="Go back"
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.backButton,
                  pressed && styles.backButtonPressed,
                ]}
                onPress={handleBack}>
                <ArrowLeftIcon color={colors.ink} size={26} />
              </Pressable>
              <Text style={styles.title}>Edit Log</Text>
            </View>

            <View style={styles.titleSection}>
              <TextInput
                value={title}
                onChangeText={(text) => {
                  setTitle(text);
                  clearSaveError();
                }}
                placeholder="Name this log..."
                returnKeyType="next"
                maxLength={inputLimits.logTitle}
                onSubmitEditing={() => locationInputRef.current?.focus()}
                style={styles.titleInput}/>
              <View style={styles.dateRow}>
                <TextInput
                  ref={locationInputRef}
                  value={location}
                  onChangeText={(text) => {
                    setLocation(text);
                    clearSaveError();
                  }}
                  style={styles.locationInput}
                  placeholder="Location..."
                  returnKeyType="done"
                  maxLength={inputLimits.logLocation}
                  onSubmitEditing={Keyboard.dismiss}/>
                <View style={styles.datePickerGroup}>
                  <Text style={styles.dateText}>When:</Text>
                  <DateTimePicker
                    value={date}
                    onValueChange={(_event, selectedDate) => {
                      setDate(selectedDate);
                      clearSaveError();
                    }}
                    mode="date"
                    display="compact"
                    style={styles.datePicker}/>
                </View>
              </View>
            </View>
          </View>

          {isLogLoading || logError ? (
            <View style={styles.stateSection}>
              <Text style={styles.stateText}>{isLogLoading ? 'Loading log...' : logError}</Text>
            </View>
          ) : (
            <>
              <View style={styles.peopleSection}>
                <Text style={styles.sectionLabel}>Who was there · {people.length}</Text>
                <View style={styles.peopleGrid}>
                  {people.map((person) => (
                    <PersonPill
                      key={person.id}
                      displayName={person.displayName}
                    />
                  ))}
                  {/*isLogCreator && (
                    <Pressable
                      style={({ pressed }) => [
                        styles.addPersonButton,
                        pressed && styles.addPersonButtonPressed,
                      ]}
                      onPress={handleOpenAddPeopleSheet}>
                      <UserPlusIcon color={colors.terracottaDeep} size={16} />
                      <Text style={styles.addPersonText}>Add</Text>
                    </Pressable>
                  )*/
                  //No add button until the API supports it.
                  }
                </View>
              </View>

              <View style={styles.timelineSection}>
                <View style={styles.timelineHeader}>
                  <Text style={styles.sectionLabel}>Moments</Text>
                  <Text style={styles.sectionLabel}>{moments.length} added</Text>
                </View>
                <View style={styles.momentListCard}>
                  {moments.map((moment) => (
                    <Pressable
                      key={moment.id}
                      style={({ pressed }) => [
                        styles.momentRow,
                        pressed && styles.momentRowPressed,
                      ]}
                      onPress={() => handleOpenEditMomentSheet(moment)}
                    >
                      <Text style={styles.momentTime}>{moment.approxTime}</Text>
                      <Text style={styles.momentTitle}>{moment.title}</Text>
                    </Pressable>
                  ))}
                  <Pressable
                    style={styles.addMomentButton}
                    onPress={handleOpenAddMomentSheet}>
                    {({ pressed }) => (
                      <>
                        <PathIcon
                          color={pressed ? colors.terracottaSoft : colors.terracotta}
                          size={18}
                        />
                        <Text style={[styles.addMomentText, pressed && styles.addMomentTextPressed]}>
                          Add moment
                        </Text>
                      </>
                    )}
                  </Pressable>
                </View>
              </View>

              <View style={styles.notesSection}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.noteCardsScroll}
                  contentContainerStyle={styles.noteCardsContent}>
                  {notePromptColumns.map((column) => (
                    <View
                      key={column.map((prompt) => prompt.promptType).join('-')}
                      style={styles.noteColumn}>
                      {column.map((prompt) => (
                        <View key={prompt.promptType} style={[styles.noteCard, { width: noteCardWidth }]}>
                          <Text style={styles.notePrompt}>{prompt.label}</Text>

                          <TextInput
                            value={noteAnswers[prompt.promptType] ?? ''}
                            onChangeText={(text) => {
                              clearSaveError();
                              setNoteAnswers((previousAnswers) => {
                                return {
                                  ...previousAnswers,
                                  [prompt.promptType]: text,
                                };
                              });
                            }}
                            onFocus={handleNoteFocus}
                            placeholder="Enter note..."
                            multiline
                            maxLength={inputLimits.promptedNoteAnswer}
                            style={styles.noteAnswer}/>
                        </View>
                      ))}
                    </View>
                  ))}
                </ScrollView>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      <View
        style={[
          styles.saveBar,
          { paddingBottom: insets.bottom },
        ]}>
        {saveError && (
          <Text style={styles.saveErrorText}>{saveError}</Text>
        )}
        <PrimaryButton
          label={isSaving ? 'Publishing...' : 'Publish changes'}
          variant="save"
          disabled={!canSaveChanges}
          onPress={handleSaveChanges}
          icon={(
            <TrayArrowDownIcon color={colors.paperCard} size={18} weight="bold" />
          )}
        />
      </View>

      <AddPersonSheet
        sheetRef={addPeopleSheetRef}
        bottomInset={insets.bottom}
        friends={acceptedFriends}
        addedFriendIds={addedFriendIds}
        isFriendsLoading={false}
        friendsError={null}
        onAddFriendPerson={handleAddFriendPerson}
        newPersonName={newPersonName}
        onChangeNewPersonName={(text) => {
          setNewPersonName(text);
          clearSaveError();
        }}
        onAddPerson={handleAddPerson}
      />

      <AddMomentSheet
        sheetRef={addMomentSheetRef}
        bottomInset={insets.bottom}
        newMomentTitle={newMomentTitle}
        onChangeNewMomentTitle={(text) => {
          setNewMomentTitle(text);
          clearSaveError();
        }}
        newMomentTime={newMomentTime}
        onChangeNewMomentTime={(text) => {
          setNewMomentTime(text);
          clearSaveError();
        }}
        onAddMoment={handleAddMoment}
      />

      <EditMomentSheet
        sheetRef={editMomentSheetRef}
        bottomInset={insets.bottom}
        momentTitle={editMomentTitle}
        onChangeMomentTitle={(text) => {
          setEditMomentTitle(text);
          clearSaveError();
        }}
        momentTime={editMomentTime}
        onChangeMomentTime={(text) => {
          setEditMomentTime(text);
          clearSaveError();
        }}
        onSaveMoment={handleSaveMoment}
        onDeleteMoment={handleDeleteMoment}
        />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  title: {
    flex: 1,
    fontFamily: fonts.display,
    fontSize: type.displayM.fontSize,
    lineHeight: type.displayM.lineHeight,
    letterSpacing: type.displayM.letterSpacing,
    color: colors.terracotta,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: layout.mobileGutter,
    gap: layout.sectionSpacing,
  },
  headerSection: {
    gap: spacing.s3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s2,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
  },
  backButtonPressed: {
    backgroundColor: colors.paperEdge,
    boxShadow: shadows.press,
  },
  titleSection: {
    gap: spacing.s3,
  },
  titleInput: {
    width: '100%',
    fontFamily: fonts.display,
    fontSize: type.displayL.fontSize,
    lineHeight: type.displayL.lineHeight,
    letterSpacing: type.displayL.letterSpacing,
    color: colors.ink,
    paddingVertical: 0,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s3,
  },
  locationInput: {
    flex: 1,
    minHeight: 44,
    backgroundColor: colors.paperCard,
    borderRadius: radius.m,
    borderWidth: 1,
    borderColor: colors.paperEdge,
    paddingHorizontal: spacing.s2,
    paddingBottom: spacing.s1,
    fontFamily: fonts.bodyStrong,
    fontSize: type.bodyL.fontSize,
    lineHeight: type.bodyL.lineHeight,
    color: colors.ink,
  },
  datePickerGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    gap: spacing.s1,
    borderRadius: radius.m,
    borderWidth: 1,
    borderColor: colors.paperEdge,
    paddingHorizontal: spacing.s3,
    backgroundColor: colors.paperCard,
  },
  dateText: {
    fontFamily: fonts.label,
    fontSize: type.label.fontSize,
    lineHeight: type.label.lineHeight,
    letterSpacing: type.label.letterSpacing,
    textTransform: type.label.textTransform,
    color: colors.inkMid,
  },
  datePicker: {
    width: 140,
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
    boxShadow: shadows.card,
  },
  momentRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.s4,
    borderBottomWidth: 1,
    borderBottomColor: colors.rule,
    paddingVertical: spacing.s1,
  },
  momentRowPressed: {
    backgroundColor: colors.paperEdge,
    boxShadow: shadows.press,
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
  addMomentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.s2,
    gap: spacing.s1,
  },
  addMomentText: {
    fontFamily: fonts.bodyStrong,
    fontSize: type.body.fontSize,
    color: colors.terracotta,
  },
  addMomentTextPressed: {
    color: colors.terracottaSoft,
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
    textAlignVertical: 'top',
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
  addPersonButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s1,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.inkSoft,
    borderRadius: radius.pill,
    paddingLeft: spacing.s1,
    paddingRight: spacing.s2,
  },
  addPersonButtonPressed: {
    backgroundColor: colors.paperEdge,
    boxShadow: shadows.press,
    transform: [{ scale: 0.98 }],
  },
  addPersonText: {
    fontFamily: fonts.label,
    fontSize: type.bodyS.fontSize,
    lineHeight: type.bodyS.lineHeight,
    color: colors.terracottaDeep,
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
  saveBar: {
    paddingTop: layout.verticalCardGap,
    paddingHorizontal: layout.mobileGutter,
    borderTopWidth: 1,
    borderTopColor: colors.paperEdge,
    backgroundColor: colors.paper,
  },
  saveErrorText: {
    marginBottom: spacing.s2,
    fontFamily: fonts.body,
    fontSize: type.bodyS.fontSize,
    lineHeight: type.bodyS.lineHeight,
    color: colors.terracottaDeep,
    textAlign: 'center',
  },
});
