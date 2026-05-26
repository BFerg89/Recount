import type { LogEntry } from './logModels';

const testLogId = 'testId';
const testCreatedAt = '2026-05-22T00:00:00.000Z';

export const logEntries: LogEntry[] = [
  {
    id: testLogId,
    creatorId: null,
    title: 'Test Log',
    date: '2026-05-22',
    generalLocation: 'Test City',
    createdAt: testCreatedAt,
    updatedAt: testCreatedAt,
    people: [
      {
        id: 'test-person-1',
        logId: testLogId,
        displayName: 'India',
        createdAt: testCreatedAt,
        updatedAt: testCreatedAt,
      },
      {
        id: 'test-person-2',
        logId: testLogId,
        displayName: 'Juliana',
        createdAt: testCreatedAt,
        updatedAt: testCreatedAt,
      },
      {
        id: 'test-person-3',
        logId: testLogId,
        displayName: 'Bennett',
        createdAt: testCreatedAt,
        updatedAt: testCreatedAt,
      },
    ],
    timelineEvents: [
      {
        id: 'test-event-1',
        logId: testLogId,
        approxTime: '8:00pm',
        title: 'Triple Platinum Pres',
        sortOrder: 0,
        createdAt: testCreatedAt,
        updatedAt: testCreatedAt,
      },
      {
        id: 'test-event-2',
        logId: testLogId,
        approxTime: '10:00pm',
        title: 'Dunny',
        sortOrder: 1,
        createdAt: testCreatedAt,
        updatedAt: testCreatedAt,
      },
      {
        id: 'test-event-3',
        logId: testLogId,
        approxTime: '12:00am',
        title: 'Union',
        sortOrder: 2,
        createdAt: testCreatedAt,
        updatedAt: testCreatedAt,
      },
      {
        id: 'test-event-4',
        logId: testLogId,
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
