import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll } from 'vitest';

// Automatic cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock IntersectionObserver (commonly used in components)
beforeAll(() => {
  global.IntersectionObserver = class IntersectionObserver {
    readonly root = null;
    readonly rootMargin = '';
    readonly thresholds = [];

    constructor() {}
    disconnect() {}
    observe() {}
    unobserve() {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  } as any;
});
