import DateTimePicker from '@expo/ui/datetimepicker';
import { SymbolView } from 'expo-symbols';
import { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';

import { placeholderPeople } from '@/data/people';
import { promptAnswers } from '@/data/promptedNotes';

const gridGap = 16;
const contentPadding = 16;
const sectionPadding = 16;
const visibleNoteCards = 2.5;
const screenBackgroundColor = '#F5F2EA';
const headlineFontFamily = 'Newsreader_700Bold';
const bodyFontFamily = 'BeVietnamPro_400Regular';
const bodyStrongFontFamily = 'BeVietnamPro_600SemiBold';
const labelFontFamily = 'SplineSans_500Medium';

export default function CreateScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const noteCardWidth = (width - contentPadding * 2 - sectionPadding * 2 - gridGap * 2) / visibleNoteCards;

  const [date, setDate] = useState(new Date());
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [noteAnswers, setNoteAnswers] = useState(() => new Map(promptAnswers));

  const addPeopleSheetRef = useRef<BottomSheet>(null);
  const addPeopleSheetSnapPoints = useMemo(() => ['65'], []);

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
        <View style={[styles.section, styles.timelineSection]}>
          <Text style={styles.sectionLabel}>Timeline</Text>
        </View>
        <View style={[styles.section, styles.notesSection]}>
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
        <View style={[styles.section, styles.peopleSection]}>
          <Text style={styles.sectionLabel}>{placeholderPeople.length} People:</Text>
            <View style={styles.peopleGrid}>
              {placeholderPeople.map((person) => (
                <View
                  key={person.id}
                  style={styles.person}
                >
                  <SymbolView name={{
                    ios: 'person.circle',
                    android: 'person',
                  }}/>
                  <Text style={styles.personText}>{person.displayName}</Text>
                </View>
              ))}
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.addPersonButton,
                pressed && styles.addPersonButtonPressed,
              ]}
              onPress={() => addPeopleSheetRef.current?.expand()}>
              <SymbolView name={{
                ios: 'plus.circle',
                android: 'add',
              }}/>
              <Text style={styles.addPersonText}>Add person</Text>
            </Pressable>
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
    gap: 8,
    backgroundColor: screenBackgroundColor,
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    paddingHorizontal: 24,
    fontFamily: headlineFontFamily,
    fontSize: 32,
  },
  content: {
    flexGrow: 1,
    padding: contentPadding,
    gap: 16,
  },
  titleSection: {
    gap: 8,
  },
  titleInput: {
    width: '100%',
    fontFamily: bodyStrongFontFamily,
    fontSize: 32,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationInput: {
    flex: 1,
    fontFamily: bodyStrongFontFamily,
    fontSize: 24,
    paddingVertical: 0,
  },
  datePickerGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    fontFamily: bodyStrongFontFamily,
    fontSize: 24,
  },
  datePicker: {
    width: 140,
  },
  section: {
    padding: sectionPadding,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'grey',
    borderRadius: 8,
  },
  timelineSection: {
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
    height: '100%',
    borderRadius: 8,
    padding: 16,
    backgroundColor: '#fff',
  },
  notePrompt: {
    fontFamily: bodyStrongFontFamily,
  },
  noteAnswer: {
    fontFamily: bodyFontFamily,
  },
  peopleSection: {
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  peopleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-evenly',
    gap: 8,
    rowGap: 12,
    paddingVertical: 8,
  },
  person: {
    flexDirection: 'row',
    backgroundColor: 'rgba(80, 74, 69, 0.25)',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  personText: {
    fontFamily: labelFontFamily,
    fontSize: 16,
  },
  addPersonButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(17, 24, 39, 0.35)',
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  addPersonButtonPressed: {
    backgroundColor: 'rgba(80, 74, 69, 0.16)',
    borderColor: 'rgba(17, 24, 39, 0.55)',
    transform: [{ scale: 0.98 }],
  },
  addPersonText: {
    fontFamily: labelFontFamily,
    fontSize: 16,
    color: '#111827',
  },
  sectionLabel: {
    fontFamily: bodyStrongFontFamily,
    fontSize: 16,
    color: '#111827',
  },
  addPeopleSheetContent: {
    padding: 24,
    alignItems: 'center',
  },
  addPeopleSheetBackground: {
    backgroundColor: '#ddd6c4',
  }
});
