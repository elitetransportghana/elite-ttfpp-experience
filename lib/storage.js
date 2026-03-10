const STORAGE_KEY = 'ttfpp_senior_experience_wizard_v1';
const SCHEMA_VERSION = 1;

export function createEmptyState() {
  const timestamp = new Date().toISOString();
  return {
    schemaVersion: SCHEMA_VERSION,
    startedAt: timestamp,
    updatedAt: timestamp,
    currentStep: 0,
    answers: {},
    lastSubmission: null,
  };
}

export function loadDraft() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);

    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    if (parsed.schemaVersion !== SCHEMA_VERSION) {
      return null;
    }

    if (!parsed.answers || typeof parsed.answers !== 'object') {
      return null;
    }

    return parsed;
  } catch (error) {
    console.warn('Could not load saved draft:', error);
    return null;
  }
}

export function saveDraft(state) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('Could not save draft:', error);
  }
}

export function clearDraft() {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
}

export function getStorageKey() {
  return STORAGE_KEY;
}
