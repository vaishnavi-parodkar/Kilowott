/** Connection-simulator settings (latency / outage), kept in the backend or, in browser-only mode, localStorage. */
import { USE_BACKEND, apiFetch } from './backendApi.js';
import { getMockSettings, configureMockApi } from './mockWooServer.js';

export const defaultSettings = { latencyMs: 450, simulateOutage: false };

export async function loadSettings() {
  if (!USE_BACKEND) return getMockSettings();
  return (await apiFetch('GET', '/woo/settings')).data;
}

export async function updateSettings(patch) {
  if (!USE_BACKEND) {
    configureMockApi(patch);
    return getMockSettings();
  }
  return (await apiFetch('PUT', '/woo/settings', patch)).data;
}
