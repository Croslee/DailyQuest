import 'fake-indexeddb/auto';
import { vi, beforeEach } from 'vitest';

// Mock chrome APIs
const chromeMock = {
  runtime: {
    getURL: vi.fn((path: string) => `chrome-extension://mock-id/${path}`),
    onInstalled: { addListener: vi.fn() },
    onMessage: { addListener: vi.fn() },
    sendMessage: vi.fn(),
  },
  storage: {
    local: {
      get: vi.fn(),
      set: vi.fn(),
    },
  },
  alarms: {
    create: vi.fn(),
    onAlarm: { addListener: vi.fn() },
    clear: vi.fn(),
  },
  tabs: {
    create: vi.fn(),
  },
  action: {
    setBadgeText: vi.fn(),
    setBadgeBackgroundColor: vi.fn(),
  },
};

Object.assign(globalThis, { chrome: chromeMock });

beforeEach(() => {
  vi.clearAllMocks();
});
