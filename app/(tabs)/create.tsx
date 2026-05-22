import DateTimePicker from '@expo/ui/datetimepicker';
import { SymbolView } from 'expo-symbols';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomSheet from '@gorhom/bottom-sheet';

import { AddMomentSheet } from '@/components/create/AddMomentSheet';
import { AddPersonSheet } from '@/components/create/AddPersonSheet';

import { nightLogTheme } from '@/constants/NightLogTheme';

import type { CreatePersonInput } from '@/data/people';
import { createEmptyPromptedNoteAnswers, promptedNoteDefinitions } from '@/data/promptedNotes';
import type { CreateTimelineEventInput } from '@/data/timelineMoments';

import { useNightLogs } from '@/context/NightLogsContext';

const { colors, fonts, layout, radius, shadows, spacing, type } = nightLogTheme;

const gridGap = spacing.s4;

export default function CreateScreen() {
  const { createNightLog } = useNightLogs();
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

  const [date, setDate] = useState(new Date());
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [noteAnswers, setNoteAnswers] = useState(createEmptyPromptedNoteAnswers);

  const [people, setPeople] = useState<CreatePersonInput[]>([]);
  const [newPersonName, setNewPersonName] = useState('');

  const [moments, setMoments] = useState<CreateTimelineEventInput[]>([]);
  const [newMomentTitle, setNewMomentTitle] = useState('');
  const [newMomentTime, setNewMomentTime] = useState('');

  const addPeopleSheetRef = useRef<BottomSheet>(null);
  const addMomentSheetRef = useRef<BottomSheet>(null);
  const scrollRef = useRef<ScrollView>(null);

  const canCreateLog = title.trim().length > 0 && location.trim().length > 0;

  const resetCreateForm = () => {
    setDate(new Date());
    setTitle('');
    setLocation('');
    setNoteAnswers(createEmptyPromptedNoteAnswers());
    setPeople([]);
    setNewPersonName('');
    setMoments([]);
    setNewMomentTitle('');
    setNewMomentTime('');
  };
  
  const handleNoteFocus = () => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true })
    }, 0);
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

    setPeople((currentPeople) => [...currentPeople, newPerson]);
    setNewPersonName('');
    addPeopleSheetRef.current?.close();
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

    setMoments((currentMoments) => [...currentMoments, newMoment]);
    setNewMomentTitle('');
    setNewMomentTime('');
    addMomentSheetRef.current?.close();
  };

  const handleCreateLog = () => {
    if (!canCreateLog) {
      return;
    }

    createNightLog({
      title: title.trim(),
      date,
      generalLocation: location.trim(),
      people,
      moments,
      noteAnswers,
    });
    resetCreateForm();
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 12 }]}>
      <Text style={styles.title}>Create Log</Text>
      <ScrollView
        ref={scrollRef}
        style={styles.contentContainer} 
        contentContainerStyle={styles.content}
        automaticallyAdjustKeyboardInsets={true}>
        <View style={styles.titleSection}>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder='Name your night...'
            style={styles.titleInput}/>
          <View style={styles.dateRow}>
            <TextInput
              value={location}
              onChangeText={setLocation}
              style={styles.locationInput}
              placeholder='Location...'/>
            <View style={styles.datePickerGroup}>
              <Text style={styles.dateText}>When:</Text>
              <DateTimePicker
                value={date}
                onValueChange={(_event, selectedDate) => {
                  setDate(selectedDate);
                }}
                mode="date"
                display="compact"
                style={styles.datePicker}/>
            </View>
          </View>
        </View>
        <View style={styles.peopleSection}>
          <Text style={styles.sectionLabel}>Who was there · {people.length}</Text>
            <View style={styles.peopleGrid}>
              {people.map((person) => (
                <View
                  key={person.id}
                  style={styles.person}
                >
                  <SymbolView name={{
                    ios: 'person.circle',
                    android: 'person',
                  }}
                  tintColor={colors.ink}/>
                  <Text style={styles.personText}>{person.displayName}</Text>
                </View>
              ))}
              <Pressable
                style={({ pressed }) => [
                  styles.addPersonButton,
                  pressed && styles.addPersonButtonPressed,
                ]}
                onPress={() => addPeopleSheetRef.current?.expand()}>
                <SymbolView name={{
                  ios: 'plus.circle',
                  android: 'add',
                }}
                tintColor={colors.terracottaDeep}/>
                <Text style={styles.addPersonText}>Add</Text>
              </Pressable>
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
            <Pressable
              style={styles.addMomentButton}
              onPress={() => addMomentSheetRef.current?.expand()}>
              {({ pressed }) => (
                <>
                  <SymbolView name={{
                    ios: 'plus.circle',
                    android: 'add_circle',
                  }}
                  tintColor={pressed ? colors.terracottaSoft : colors.terracotta}
                  size={18}/>
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
                      style={styles.noteAnswer}/>
                  </View>
                ))}
              </View>
            ))}
          </ScrollView>
        </View>

      </ScrollView>

      <View style={styles.saveBar}>
        <Pressable
          disabled={!canCreateLog}
          accessibilityState={{ disabled: !canCreateLog }}
          style={({ pressed }) => [
            styles.saveButton,
            pressed && canCreateLog && styles.saveButtonPressed,
            !canCreateLog && styles.saveButtonDisabled,
          ]} 
          onPress={handleCreateLog}>
          <SymbolView
            name={{
              ios: 'square.and.arrow.down',
              android: 'save',
            }}
            tintColor={colors.paperCard}
            size={18}
          />
          <Text style={styles.saveButtonText}>Save</Text>
        </Pressable>
      </View>

      <AddPersonSheet
        sheetRef={addPeopleSheetRef}
        bottomInset={insets.bottom}
        newPersonName={newPersonName}
        onChangeNewPersonName={setNewPersonName}
        onAddPerson={handleAddPerson}/>

      <AddMomentSheet
        sheetRef={addMomentSheetRef}
        bottomInset={insets.bottom}
        newMomentTitle={newMomentTitle}
        onChangeNewMomentTitle={setNewMomentTitle}
        newMomentTime={newMomentTime}
        onChangeNewMomentTime={setNewMomentTime}
        onAddMoment={handleAddMoment}/>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  contentContainer: {
    flex: 1,
    marginTop: spacing.s3,
  },
  title: {
    paddingHorizontal: layout.mobileGutter,
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
  saveBar: {
    paddingVertical: layout.verticalCardGap,
    paddingHorizontal: layout.mobileGutter,
    borderTopWidth: 1,
    borderTopColor: colors.paperEdge,
  },
  saveButton: {
    minHeight: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.terracotta,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.s2,
    boxShadow: shadows.card,
  },
  saveButtonPressed: {
    backgroundColor: colors.terracottaDeep,
    boxShadow: shadows.press,
    transform: [{ scale: 0.98 }],
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontFamily: fonts.bodyStrong,
    fontSize: type.body.fontSize,
    lineHeight: type.body.lineHeight,
    color: colors.paperCard,
  },
});
