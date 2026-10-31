// Vitest setup file
import { afterEach } from 'vitest';

afterEach(() => {
  // Clear any test storage
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.clear();
  }
});

