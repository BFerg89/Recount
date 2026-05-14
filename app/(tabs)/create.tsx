import DateTimePicker from '@expo/ui/datetimepicker';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const gridGap = 16;
const contentPadding = 16;
const sectionPadding = 16;
const visibleNoteCards = 2.5;
const screenBackgroundColor = '#F5F2EA';
const headlineFontFamily = 'Newsreader_700Bold';
const bodyFontFamily = 'BeVietnamPro_600SemiBold';
const bodyStrongFontFamily = 'BeVietnamPro_600SemiBold';
const labelFontFamily = 'SplineSans_500Medium';

const testNums: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function CreateScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const noteCardWidth = (width - contentPadding * 2 - sectionPadding * 2 - gridGap * 2) / visibleNoteCards;

  const [date, setDate] = useState(new Date());
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');

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
            {testNums.map((num) => (
              <View key={num} style={[styles.noteCard, { width: noteCardWidth }]}>
                <Text>{num}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
        <View style={[styles.section, styles.peopleSection]}>
          <Text style={styles.sectionLabel}>People</Text>
        </View>
      </ScrollView>
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
    flex: 1,
    padding: sectionPadding,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineSection: {
    borderWidth: 1,
    borderColor: 'black',
  },
  notesSection: {
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    borderWidth: 1,
    borderColor: 'black',
  },
  noteCardsScroll: {
    flex: 1,
  },
  noteCardsContent: {
    gap: gridGap,
  },
  noteCard: {
    height: '100%',
    justifyContent: 'space-between',
    borderRadius: 8,
    padding: 16,
    backgroundColor: '#fff',
  },
  peopleSection: {
    borderWidth: 1,
    borderColor: 'black',
  },
  sectionLabel: {
    fontFamily: labelFontFamily,
    fontSize: 16,
    color: '#111827',
  },
});
