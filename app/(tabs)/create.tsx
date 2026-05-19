import DateTimePicker from '@expo/ui/datetimepicker';
import { SymbolView } from 'expo-symbols';
import { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';

import { nightLogTheme } from '@/constants/NightLogTheme';
import { placeholderPeople } from '@/data/people';
import { promptAnswers } from '@/data/promptedNotes';
import { placeholderMoments } from '@/data/timelineMoments';

const { colors, fonts, layout, radius, shadows, spacing, type } = nightLogTheme;

const gridGap = spacing.s4;

export default function CreateScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const noteCardWidth = Math.min(
    336,
    Math.max(292, width - layout.mobileGutter * 2 - spacing.s6)
  ) / 2.2;

  const [date, setDate] = useState(new Date());
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [noteAnswers, setNoteAnswers] = useState(() => new Map(promptAnswers));

  const addPeopleSheetRef = useRef<BottomSheet>(null);
  const addPeopleSheetSnapPoints = useMemo(() => ['55'], []);

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 12 }]}>
      <Text style={styles.title}>Create Log</Text>
      <ScrollView style={styles.contentContainer} contentContainerStyle={styles.content}>
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
          <Text style={styles.sectionLabel}>Who was there · {placeholderPeople.length}</Text>
            <View style={styles.peopleGrid}>
              {placeholderPeople.map((person) => (
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
            <Text style={styles.sectionLabel}>{placeholderMoments.length} added</Text>
          </View>
          <View style={styles.momentListCard}>
            {placeholderMoments.map((moment) => (
              <View
                key={moment.id}
                style={styles.momentRow}>
                <Text style={styles.momentTime}>{moment.approxTime}</Text>
                <Text style={styles.momentTitle}>{moment.title}</Text>
              </View>
            ))}
            <Pressable
              style={styles.addMomentButton}>
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
            {Array.from(noteAnswers.entries()).map(([prompt, answer]) => (
              <View key={prompt} style={[styles.noteCard, { width: noteCardWidth }]}>
                <Text style={styles.notePrompt}>{prompt}</Text>

                <TextInput
                  value={answer}
                  onChangeText={(text) => {
                    setNoteAnswers((previousAnswers) => {
                      const updatedAnswers = new Map(previousAnswers);
                      updatedAnswers.set(prompt, text);
                      return updatedAnswers;
                    });
                  }}
                  placeholder="Enter note..."
                  multiline
                  style={styles.noteAnswer}/>
              </View>
            ))}
          </ScrollView>
        </View>

      </ScrollView>

      <BottomSheet
        ref={addPeopleSheetRef}
        index={-1}
        snapPoints={addPeopleSheetSnapPoints}
        enablePanDownToClose
        backgroundStyle={styles.addPeopleSheetBackground}
      >
        <BottomSheetView
          style={styles.addPeopleSheetContent}>
          <Text>Add Person Sheet</Text>
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    gap: spacing.s3,
    backgroundColor: colors.paper,
  },
  contentContainer: {
    flex: 1,
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
    minHeight: 172,
  },
  noteCardsScroll: {
    flex: 1,
  },
  noteCardsContent: {
    gap: gridGap,
  },
  noteCard: {
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
    fontFamily: fonts.body,
    fontSize: type.body.fontSize,
    lineHeight: type.body.lineHeight,
    color: colors.ink,
    paddingVertical: spacing.s2,
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
  addPeopleSheetContent: {
    padding: spacing.s5,
    alignItems: 'center',
    backgroundColor: colors.paperDeep,
  },
  addPeopleSheetBackground: {
    backgroundColor: colors.paperDeep,
  },
});
