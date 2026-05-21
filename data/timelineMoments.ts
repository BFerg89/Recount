export type DraftTimelineMoment = {
  id: string;
  approxTime: string | null;
  title: string;
};

export const placeholderMoments: DraftTimelineMoment[] = [
  {
    id: '1',
    approxTime: '8:00pm',
    title: 'Triple Platinum Pres'
  },
  {
    id: '2',
    approxTime: '10:00pm',
    title: 'Dunny'
  },
  {
    id: '3',
    approxTime: '12:00am',
    title: 'Union'
  },
  {
    id: '4',
    approxTime: '2:00am',
    title: '111b'
  },
];