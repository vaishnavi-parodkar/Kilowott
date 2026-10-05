import { beforeEach } from 'vitest';
import { resetMockServer, configureMockApi } from '../services/mockWooServer.js';

// Every test starts with a fresh mock WooCommerce store and zero network latency.
beforeEach(() => {
  resetMockServer();
  configureMockApi({ latencyMs: 0 });
});
