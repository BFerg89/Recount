export type NightLogEntry = {
  id: string;
  date: string;
  title: string;
  time: string;
  location: string;
  people: string[];
  timeline: string[];
};

export const logEntries: NightLogEntry[] = [
  {
    id: 'jan-1',
    date: '2026-01-02',
    title: 'Pub Night',
    time: '8:15 PM',
    location: 'Vancouver',
    people: ['Alex', 'Cam', 'Rhys'],
    timeline: ['Pre\'s', 'Hynes', 'Afters']
  },
  {
    id: 'jan-2',
    date: '2026-01-06',
    title: 'Club 601',
    time: '11:40 PM',
    location: 'Vancouver',
    people: ['Alex', 'Cam', 'Rhys'],
    timeline: ['Pre\'s', 'Hynes', 'Afters']
  },
  {
    id: 'feb-1',
    date: '2026-02-20',
    title: 'Greys',
    time: '8:01 PM',
    location: 'Vancouver',
    people: ['Alex', 'Cam', 'Rhys'],
    timeline: ['Pre\'s', 'Hynes', 'Afters']
  },
];