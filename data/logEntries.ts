import type { NightLogEntry } from './nightLogModels';

const testNightLogId = 'testId';
const testCreatedAt = '2026-05-22T00:00:00.000Z';

export const logEntries: NightLogEntry[] = [
  {
    id: testNightLogId,
    creatorId: null,
    title: 'Test Night',
    date: '2026-05-22',
    generalLocation: 'Test City',
    createdAt: testCreatedAt,
    updatedAt: testCreatedAt,
    people: [
      {
        id: 'test-person-1',
        nightLogId: testNightLogId,
        displayName: 'India',
        createdAt: testCreatedAt,
        updatedAt: testCreatedAt,
      },
      {
        id: 'test-person-2',
        nightLogId: testNightLogId,
        displayName: 'Juliana',
        createdAt: testCreatedAt,
        updatedAt: testCreatedAt,
      },
      {
        id: 'test-person-3',
        nightLogId: testNightLogId,
        displayName: 'Bennett',
        createdAt: testCreatedAt,
        updatedAt: testCreatedAt,
      },
    ],
    timelineEvents: [
      {
        id: 'test-event-1',
        nightLogId: testNightLogId,
        approxTime: '8:00pm',
        title: 'Triple Platinum Pres',
        sortOrder: 0,
        createdAt: testCreatedAt,
        updatedAt: testCreatedAt,
      },
      {
        id: 'test-event-2',
        nightLogId: testNightLogId,
        approxTime: '10:00pm',
        title: 'Dunny',
        sortOrder: 1,
        createdAt: testCreatedAt,
        updatedAt: testCreatedAt,
      },
      {
        id: 'test-event-3',
        nightLogId: testNightLogId,
        approxTime: '12:00am',
        title: 'Union',
        sortOrder: 2,
        createdAt: testCreatedAt,
        updatedAt: testCreatedAt,
      },
      {
        id: 'test-event-4',
        nightLogId: testNightLogId,
        approxTime: '2:00am',
        title: '111b',
        sortOrder: 3,
        createdAt: testCreatedAt,
        updatedAt: testCreatedAt,
      },
    ],
    notes: [],
  }
];
