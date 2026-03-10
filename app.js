import {
  getQuestionOptions,
  getQuestionById,
  getVisibleSections,
} from './lib/questionnaire.js';
import { clearDraft, createEmptyState, loadDraft, saveDraft } from './lib/storage.js';
import { transcribeAudioBlob } from './lib/transcription.js';

// ─── SVG icon strings ────────────────────────────────────────────────────────
const SVG_MIC = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>`;
const SVG_STOP = `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>`;
const SVG_CHECK = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>`;
const SVG_PENCIL = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;

const API_BASE = window.TTFPP_API_BASE || '';

// ─── DOM references ───────────────────────────────────────────────────────────
const elements = {
  panelHost:            document.getElementById('panelHost'),
  progressFill:         document.getElementById('progressFill'),
  progressLabel:        document.getElementById('progressLabel'),
  progressMessage:      document.getElementById('progressMessage'),
  progressLabelVis:     document.getElementById('progressLabelVis'),
  progressMessageVis:   document.getElementById('progressMessageVis'),
  questionCounter:      document.getElementById('questionCounter'),
  sectionChips:         document.getElementById('sectionChips'),
  prevButton:           document.getElementById('prevButton'),
  nextButton:           document.getElementById('nextButton'),
  exportButton:         document.getElementById('exportButton'),
  resetButton:          document.getElementById('resetButton'),
  saveStatus:           document.getElementById('saveStatus'),
  submitStatus:         document.getElementById('submitStatus'),
  topBar:               document.querySelector('.top-bar'),
};

// ─── App state ────────────────────────────────────────────────────────────────
let state = loadDraft() || createEmptyState();
let visibleSections = [];
let questionFlow = [];
let saveTimer = null;
let submitting = false;
const recorderStore = new Map();

// ─── Navigation animation state ───────────────────────────────────────────────
let navDirection = 'forward';
let animateNextRender = false;

// ─── Init ─────────────────────────────────────────────────────────────────────
init();

function init() {
  elements.prevButton.addEventListener('click', handlePreviousStep);
  elements.nextButton.addEventListener('click', handleNextStep);
  elements.exportButton.addEventListener('click', handleExportJson);
  elements.resetButton.addEventListener('click', handleReset);
  document.addEventListener('keydown', handleKeydown);

  render();
  updateSaveStatus();
}

// ─── Keyboard navigation ──────────────────────────────────────────────────────
function handleKeydown(e) {
  const tag = document.activeElement ? document.activeElement.tagName : '';
  const isTextArea = tag === 'TEXTAREA';
  const isInput = tag === 'INPUT' || tag === 'SELECT';

  // Enter to advance (skip for textarea and radio/checkbox/select)
  if (e.key === 'Enter' && !e.shiftKey && !isTextArea) {
    const reviewIdx = questionFlow.length;
    if (state.currentStep <= reviewIdx && !submitting) {
      e.preventDefault();
      handleNextStep();
    }
    return;
  }

  // ArrowLeft / Backspace to go back (not inside inputs)
  if ((e.key === 'ArrowLeft') && !isInput && !isTextArea) {
    e.preventDefault();
    handlePreviousStep();
  }
}

// ─── Panel transition ─────────────────────────────────────────────────────────
function transitionPanel(direction, renderFn) {
  const host = elements.panelHost;

  // Slide current content out
  host.style.transition = 'opacity 150ms ease, transform 150ms ease';
  host.style.opacity = '0';
  host.style.transform = direction === 'forward' ? 'translateX(-22px)' : 'translateX(22px)';

  setTimeout(() => {
    renderFn();
    // Position new content at the incoming side (no transition)
    host.style.transition = 'none';
    host.style.opacity = '0';
    host.style.transform = direction === 'forward' ? 'translateX(22px)' : 'translateX(-22px)';

    // Force reflow so browser registers the new position
    void host.offsetHeight;

    // Animate in
    host.style.transition = 'opacity 260ms ease, transform 260ms ease';
    host.style.opacity = '1';
    host.style.transform = 'translateX(0)';
  }, 155);
}

// ─── Render orchestrator ──────────────────────────────────────────────────────
function render() {
  visibleSections = getVisibleSections(state.answers);
  questionFlow = buildQuestionFlow(visibleSections);
  const reviewStepIndex = questionFlow.length;

  if (state.currentStep < 0) state.currentStep = 0;
  if (state.currentStep > reviewStepIndex) state.currentStep = reviewStepIndex;

  renderProgressPanel();
  renderSectionChips();
  renderFooterActions();

  const renderPanel = () => {
    if (state.currentStep >= reviewStepIndex) {
      renderReviewPanel();
    } else {
      renderQuestionPanel(questionFlow[state.currentStep]);
    }
  };

  if (animateNextRender) {
    animateNextRender = false;
    transitionPanel(navDirection, renderPanel);
  } else {
    renderPanel();
  }
}

// ─── Flow builder ─────────────────────────────────────────────────────────────
function buildQuestionFlow(sections) {
  const flow = [];
  sections.forEach((section, sectionIndex) => {
    section.questions.forEach((questionItem, questionIndexInSection) => {
      flow.push({ section, sectionIndex, questionItem, questionIndexInSection });
    });
  });
  return flow;
}

function getFirstQuestionStepForSection(sectionId) {
  return questionFlow.findIndex((item) => item.section.id === sectionId);
}

function getStepRangeForSection(sectionId) {
  const indexes = questionFlow
    .map((item, index) => ({ item, index }))
    .filter((entry) => entry.item.section.id === sectionId)
    .map((entry) => entry.index);
  if (indexes.length === 0) return null;
  return { start: indexes[0], end: indexes[indexes.length - 1] };
}

// ─── Progress panel ───────────────────────────────────────────────────────────
function renderProgressPanel() {
  const flatVisible = visibleSections.flatMap((s) => s.questions);
  const answeredCount = flatVisible.filter((q) => hasAnswer(q, state.answers[q.id])).length;
  const totalCount = flatVisible.length || 1;
  const ratio = answeredCount / totalCount;
  const percentage = Math.round(ratio * 100);

  // Top gradient bar
  if (elements.progressFill) {
    elements.progressFill.style.width = `${percentage}%`;
  }
  if (elements.topBar) {
    elements.topBar.setAttribute('aria-valuenow', String(percentage));
  }

  // Question counter in header
  const reviewIdx = questionFlow.length;
  const isReview = state.currentStep >= reviewIdx;
  if (elements.questionCounter) {
    elements.questionCounter.textContent = isReview
      ? 'Review'
      : `Q\u202F${state.currentStep + 1}\u202F/\u202F${reviewIdx}`;
  }

  // Footer labels
  const msg = getEncouragementMessage(ratio);
  if (elements.progressLabelVis)   elements.progressLabelVis.textContent   = `${percentage}%`;
  if (elements.progressMessageVis) elements.progressMessageVis.textContent = msg;
  if (elements.progressLabel)      elements.progressLabel.textContent      = `${percentage}% complete (${answeredCount}/${totalCount} answered)`;
  if (elements.progressMessage)    elements.progressMessage.textContent    = msg;
}

// ─── Section navigation chips ─────────────────────────────────────────────────
function renderSectionChips() {
  const frag = document.createDocumentFragment();
  const reviewIdx = questionFlow.length;

  visibleSections.forEach((section, idx) => {
    const answeredCount = getAnsweredCount(section);
    const totalCount    = section.questions.length;
    const range         = getStepRangeForSection(section.id);
    const pct           = totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0;
    const isActive      = range && state.currentStep >= range.start && state.currentStep <= range.end;
    const isComplete    = answeredCount === totalCount && totalCount > 0;

    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'section-chip';
    if (isActive)   chip.classList.add('is-active');
    if (isComplete) chip.classList.add('is-complete');
    chip.style.setProperty('--chip-pct', `${pct}%`);
    chip.setAttribute('aria-label', `${section.title}, ${answeredCount} of ${totalCount} answered`);

    chip.innerHTML = `
      <span class="chip-label">§${idx + 1}</span>
      <span class="chip-name">${escapeHtml(section.title)}</span>
      <span class="chip-count">${answeredCount}/${totalCount}</span>
    `;

    chip.addEventListener('click', () => {
      const firstStep = getFirstQuestionStepForSection(section.id);
      if (firstStep < 0) return;
      navDirection = state.currentStep > firstStep ? 'backward' : 'forward';
      animateNextRender = true;
      state.currentStep = firstStep;
      touchState();
      render();
    });

    frag.appendChild(chip);
  });

  // Review chip
  const reviewChip = document.createElement('button');
  reviewChip.type = 'button';
  reviewChip.className = 'section-chip';
  if (state.currentStep === reviewIdx) reviewChip.classList.add('is-active');
  reviewChip.style.setProperty('--chip-pct', '100%');
  reviewChip.setAttribute('aria-label', 'Review and submit');
  reviewChip.innerHTML = `
    <span class="chip-label">Final</span>
    <span class="chip-name">Review & Submit</span>
    <span class="chip-count">Check all</span>
  `;
  reviewChip.addEventListener('click', () => {
    navDirection = 'forward';
    animateNextRender = true;
    state.currentStep = reviewIdx;
    touchState();
    render();
  });
  frag.appendChild(reviewChip);

  elements.sectionChips.innerHTML = '';
  elements.sectionChips.appendChild(frag);
}

// ─── Question panel ───────────────────────────────────────────────────────────
function renderQuestionPanel(flowItem) {
  const { section, sectionIndex, questionItem, questionIndexInSection } = flowItem;
  const globalPos = state.currentStep + 1;
  const totalQ    = questionFlow.length;

  const panel = document.createElement('div');
  panel.className = 'q-panel';

  // Meta row
  const meta = document.createElement('div');
  meta.className = 'q-meta';
  meta.innerHTML = `
    <span class="q-section-pill">
      <span class="q-section-dot" aria-hidden="true"></span>
      ${escapeHtml(section.title)}
    </span>
    <span class="q-position">Question ${globalPos} of ${totalQ}</span>
  `;
  panel.appendChild(meta);

  // Question card
  panel.appendChild(createQuestionCard(questionItem));

  elements.panelHost.innerHTML = '';
  elements.panelHost.appendChild(panel);
}

// ─── Question card builder ────────────────────────────────────────────────────
function createQuestionCard(questionItem) {
  const answer = state.answers[questionItem.id] || createAnswerRecord(questionItem);
  const card   = document.createElement('div');
  card.className = 'q-card';

  // Heading
  const heading = document.createElement('h2');
  heading.className = 'q-heading';
  heading.textContent = questionItem.text;
  card.appendChild(heading);

  // Helper text
  if (questionItem.helperText) {
    const helper = document.createElement('p');
    helper.className = 'q-helper-text';
    helper.textContent = questionItem.helperText;
    card.appendChild(helper);
  }

  // Medicine/Pharmacy special note
  if (questionItem.id === 'q5' && isMedicineOrPharmacySelected()) {
    const note = document.createElement('p');
    note.className = 'q-helper-text';
    note.textContent =
      'Medicine and Pharmacy students usually have a Year 1 placement, but capture your exact path here.';
    card.appendChild(note);
  }

  // Input area
  const inputArea = document.createElement('div');
  inputArea.className = 'q-input-area';
  card.appendChild(inputArea);

  if (questionItem.answerType === 'radio') {
    buildRadioInput(questionItem, answer, inputArea);
    return card;
  }

  if (questionItem.answerType === 'checkbox') {
    buildCheckboxInput(questionItem, answer, inputArea);
    return card;
  }

  if (questionItem.answerType === 'select') {
    buildSelectInput(questionItem, answer, inputArea);
  } else {
    const field = buildTextInput(questionItem, answer, inputArea);
    if (questionItem.voiceEnabled) {
      inputArea.appendChild(createVoiceControls(questionItem, field));
    }
  }

  // Keyboard hint for text-like inputs
  const hint = document.createElement('p');
  hint.className = 'q-kbd-hint';
  if (questionItem.answerType === 'long_text') {
    hint.innerHTML = '<kbd>Shift</kbd>+<kbd>Enter</kbd> for new line &nbsp;·&nbsp; click <strong>Next</strong> to continue';
  } else {
    hint.innerHTML = 'Press <kbd>↵ Enter</kbd> to continue';
  }
  card.appendChild(hint);

  return card;
}

// ─── Radio input ──────────────────────────────────────────────────────────────
function buildRadioInput(questionItem, answer, container) {
  const options = getQuestionOptions(questionItem, state.answers);
  const needsRerender = questionItem.id === 'q2' || questionItem.id === 'q3';

  const grid = document.createElement('div');
  grid.className = 'option-grid';
  if (options.length === 2) grid.classList.add('two-col');

  options.forEach((optionItem) => {
    const card = document.createElement('div');
    card.className = 'option-card';
    card.setAttribute('role', 'radio');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-checked', String(answer.selectedOption === optionItem.value));

    if (answer.selectedOption === optionItem.value) card.classList.add('is-selected');

    card.innerHTML = `
      <span class="option-indicator">
        <span class="option-indicator-dot"></span>
      </span>
      <span class="option-label">${escapeHtml(optionItem.label)}</span>
    `;

    const select = () => {
      // Update all cards in this group
      grid.querySelectorAll('.option-card').forEach((c) => {
        c.classList.remove('is-selected');
        c.setAttribute('aria-checked', 'false');
      });
      card.classList.add('is-selected');
      card.setAttribute('aria-checked', 'true');

      updateAnswer(
        questionItem,
        { selectedOption: optionItem.value, finalAnswerText: optionItem.value },
        { rerender: needsRerender }
      );

      // Auto-advance (skip for questions that trigger re-render since conditional sections change)
      if (!needsRerender) {
        setTimeout(() => {
          navDirection = 'forward';
          animateNextRender = true;
          handleNextStep();
        }, 420);
      }
    };

    card.addEventListener('click', select);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(); }
    });

    grid.appendChild(card);
  });

  container.appendChild(grid);
}

// ─── Checkbox input ───────────────────────────────────────────────────────────
function buildCheckboxInput(questionItem, answer, container) {
  const selectedValues = Array.isArray(answer.selectedOptions) ? answer.selectedOptions : [];
  const grid = document.createElement('div');
  grid.className = 'option-grid';

  (questionItem.options || []).forEach((optionItem) => {
    const card = document.createElement('div');
    card.className = 'option-card';
    card.setAttribute('role', 'checkbox');
    card.setAttribute('tabindex', '0');
    const isChecked = selectedValues.includes(optionItem.value);
    card.setAttribute('aria-checked', String(isChecked));
    if (isChecked) card.classList.add('is-checked');

    card.innerHTML = `
      <span class="option-check">
        ${SVG_CHECK}
      </span>
      <span class="option-label">${escapeHtml(optionItem.label)}</span>
    `;

    const toggle = () => {
      const current = state.answers[questionItem.id] || createAnswerRecord(questionItem);
      const vals    = new Set(Array.isArray(current.selectedOptions) ? current.selectedOptions : []);
      if (vals.has(optionItem.value)) {
        vals.delete(optionItem.value);
        card.classList.remove('is-checked');
        card.setAttribute('aria-checked', 'false');
      } else {
        vals.add(optionItem.value);
        card.classList.add('is-checked');
        card.setAttribute('aria-checked', 'true');
      }
      const selectedOptions = Array.from(vals);
      updateAnswer(questionItem, { selectedOptions, finalAnswerText: selectedOptions.join(', ') });
    };

    card.addEventListener('click', toggle);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    });

    // Style the check mark visibility
    const checkMark = card.querySelector('.option-check-mark');
    if (checkMark) checkMark.style.display = isChecked ? '' : 'none';

    grid.appendChild(card);
  });

  // Fix: The SVG check is always visible; use CSS is-checked class to show/hide via opacity
  container.appendChild(grid);
}

// ─── Select input ─────────────────────────────────────────────────────────────
function buildSelectInput(questionItem, answer, container) {
  const sel = document.createElement('select');
  sel.className = 'q-select';
  sel.setAttribute('aria-label', questionItem.text);

  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = 'Select an option…';
  sel.appendChild(placeholder);

  (questionItem.options || []).forEach((optionItem) => {
    const opt = document.createElement('option');
    opt.value = optionItem.value;
    opt.textContent = optionItem.label;
    opt.selected = answer.selectedOption === optionItem.value;
    sel.appendChild(opt);
  });

  sel.addEventListener('change', () => {
    updateAnswer(
      questionItem,
      { selectedOption: sel.value, finalAnswerText: sel.value },
      { rerender: questionItem.id === 'q3' }
    );
  });

  container.appendChild(sel);
}

// ─── Text / Textarea / Number input ──────────────────────────────────────────
function buildTextInput(questionItem, answer, container) {
  const isLong   = questionItem.answerType === 'long_text';
  const isNumber = questionItem.answerType === 'number';

  const field = document.createElement(isLong ? 'textarea' : 'input');

  if (isLong) {
    field.className = 'q-textarea';
    field.rows = 6;
  } else if (isNumber) {
    field.className = 'q-number-input';
    field.type = 'number';
  } else {
    field.className = 'q-text-input';
    field.type = 'text';
  }

  field.value       = answer.typedText || answer.finalAnswerText || '';
  field.placeholder = questionItem.placeholder || (isLong ? 'Type your response here…' : 'Type your answer…');
  field.setAttribute('aria-label', questionItem.text);

  field.addEventListener('input', () => {
    updateAnswer(questionItem, { typedText: field.value, finalAnswerText: field.value });
  });

  container.appendChild(field);
  return field;
}

// ─── Voice controls ───────────────────────────────────────────────────────────
function createVoiceControls(questionItem, textField) {
  const wrapper = document.createElement('div');
  wrapper.className = 'voice-controls';

  // Record button
  const recordBtn = document.createElement('button');
  recordBtn.type = 'button';
  recordBtn.className = 'voice-record-btn';
  recordBtn.innerHTML = `${SVG_MIC} <span>Record voice answer</span>`;

  // Recording UI
  const recordingUi = document.createElement('div');
  recordingUi.className = 'voice-recording-ui';
  recordingUi.hidden = true;
  recordingUi.innerHTML = `
    <div class="voice-waveform" aria-hidden="true">
      <span></span><span></span><span></span><span></span><span></span>
    </div>
    <span class="voice-recording-label">Recording…</span>
  `;
  const stopBtn = document.createElement('button');
  stopBtn.type = 'button';
  stopBtn.className = 'voice-stop-btn';
  stopBtn.innerHTML = `${SVG_STOP} <span>Stop</span>`;
  recordingUi.appendChild(stopBtn);

  // Transcribing UI
  const transcribingUi = document.createElement('div');
  transcribingUi.className = 'voice-transcribing-ui';
  transcribingUi.hidden = true;
  transcribingUi.innerHTML = `
    <span class="voice-spinner" aria-hidden="true"></span>
    <span class="voice-transcribing-label">Transcribing…</span>
  `;

  // Error
  const errorEl = document.createElement('p');
  errorEl.className = 'voice-error-msg';
  errorEl.hidden = true;

  wrapper.appendChild(recordBtn);
  wrapper.appendChild(recordingUi);
  wrapper.appendChild(transcribingUi);
  wrapper.appendChild(errorEl);

  const recorderState = getRecorderState(questionItem.id);

  const syncUi = () => {
    const { isRecording, isTranscribing, error } = recorderState;

    recordBtn.hidden   = isRecording || isTranscribing;
    recordBtn.disabled = isRecording || isTranscribing;

    recordingUi.hidden    = !isRecording;
    transcribingUi.hidden = !isTranscribing;

    errorEl.hidden      = !error;
    errorEl.textContent = error || '';
  };

  recordBtn.addEventListener('click', async () => {
    await startRecording(questionItem, textField, syncUi);
  });
  stopBtn.addEventListener('click', () => {
    stopRecording(questionItem.id, syncUi);
  });

  syncUi();
  return wrapper;
}

// ─── Recording logic (unchanged) ──────────────────────────────────────────────
async function startRecording(questionItem, textField, syncUi) {
  const recorderState = getRecorderState(questionItem.id);
  if (recorderState.isRecording || recorderState.isTranscribing) return;

  if (!navigator.mediaDevices || typeof MediaRecorder === 'undefined') {
    recorderState.error = 'Microphone recording is not supported in this browser.';
    syncUi();
    return;
  }

  recorderState.error = '';

  try {
    const stream    = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mimeType  = getSupportedMimeType();
    const mediaRecorder = mimeType
      ? new MediaRecorder(stream, { mimeType })
      : new MediaRecorder(stream);

    recorderState.stream        = stream;
    recorderState.mediaRecorder = mediaRecorder;
    recorderState.chunks        = [];
    recorderState.isRecording   = true;
    recorderState.isTranscribing = false;

    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) recorderState.chunks.push(event.data);
    };

    mediaRecorder.onstop = async () => {
      const blobType  = mimeType || 'audio/webm';
      const audioBlob = new Blob(recorderState.chunks, { type: blobType });

      if (!audioBlob.size) {
        recorderState.error       = 'No audio captured. Please try again.';
        recorderState.isRecording = false;
        stopStreamTracks(recorderState.stream);
        recorderState.stream        = null;
        recorderState.mediaRecorder = null;
        syncUi();
        return;
      }

      recorderState.isRecording   = false;
      recorderState.isTranscribing = true;
      stopStreamTracks(recorderState.stream);
      recorderState.stream = null;
      syncUi();

      try {
        const transcription = await transcribeAudioBlob({
          audioBlob,
          questionId: questionItem.id,
          apiBase: API_BASE,
        });

        const transcriptText = (transcription.transcript || '').trim();
        if (!transcriptText) throw new Error('Transcription returned empty text.');

        const mergedText = mergeTranscriptText(questionItem, textField.value, transcriptText);
        textField.value = mergedText;

        updateAnswer(questionItem, {
          typedText:       mergedText,
          transcriptText,
          audioUrl:        '',
          finalAnswerText: mergedText,
        });

        recorderState.error = '';
      } catch (error) {
        recorderState.error = error instanceof Error ? error.message : 'Transcription failed.';
      } finally {
        recorderState.isTranscribing = false;
        recorderState.mediaRecorder  = null;
        syncUi();
      }
    };

    mediaRecorder.start(250);
    syncUi();
  } catch (error) {
    recorderState.error =
      error instanceof Error
        ? error.message
        : 'Unable to access microphone. Check browser permissions.';
    recorderState.isRecording   = false;
    recorderState.isTranscribing = false;
    stopStreamTracks(recorderState.stream);
    recorderState.stream        = null;
    recorderState.mediaRecorder = null;
    syncUi();
  }
}

function stopRecording(questionId, syncUi) {
  const recorderState = getRecorderState(questionId);
  if (!recorderState.mediaRecorder || recorderState.mediaRecorder.state === 'inactive') {
    recorderState.isRecording = false;
    syncUi();
    return;
  }
  recorderState.mediaRecorder.stop();
  syncUi();
}

function getSupportedMimeType() {
  if (typeof MediaRecorder === 'undefined') return '';
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
  return candidates.find((c) => MediaRecorder.isTypeSupported(c)) || '';
}

function stopStreamTracks(stream) {
  if (!stream) return;
  stream.getTracks().forEach((t) => t.stop());
}

function getRecorderState(questionId) {
  if (!recorderStore.has(questionId)) {
    recorderStore.set(questionId, {
      isRecording:   false,
      isTranscribing: false,
      mediaRecorder:  null,
      stream:         null,
      chunks:         [],
      error:          '',
    });
  }
  return recorderStore.get(questionId);
}

// ─── Review panel ─────────────────────────────────────────────────────────────
function renderReviewPanel() {
  const allQ        = visibleSections.flatMap((s) => s.questions);
  const totalAns    = allQ.filter((q) => hasAnswer(q, state.answers[q.id])).length;
  const totalQ      = allQ.length;
  const allAnswered = totalAns === totalQ;

  const panel = document.createElement('div');
  panel.className = 'review-panel';

  // Header card
  const header = document.createElement('div');
  header.className = 'review-header';

  const headerLeft = document.createElement('div');
  headerLeft.innerHTML = `
    <h2 class="review-title">Final Review</h2>
    <p class="review-summary">${totalAns} of ${totalQ} visible questions answered. Edit any section before submitting.</p>
  `;

  const statPill = document.createElement('span');
  statPill.className = 'review-stat-pill';
  statPill.innerHTML = allAnswered
    ? `${SVG_CHECK} All answered`
    : `${totalAns}/${totalQ} answered`;

  header.appendChild(headerLeft);
  header.appendChild(statPill);
  panel.appendChild(header);

  // Section cards
  visibleSections.forEach((section) => {
    const sectionAnswered = getAnsweredCount(section);

    const card = document.createElement('div');
    card.className = 'review-section-card';

    // Section header
    const secHeader = document.createElement('div');
    secHeader.className = 'review-section-header';

    const secTitle = document.createElement('div');
    secTitle.innerHTML = `
      <p class="review-section-title">${escapeHtml(section.title)}</p>
      <p class="review-section-progress">${sectionAnswered}/${section.questions.length} answered</p>
    `;

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'review-edit-btn';
    editBtn.innerHTML = `${SVG_PENCIL} Edit`;
    editBtn.addEventListener('click', () => {
      const firstStep = getFirstQuestionStepForSection(section.id);
      if (firstStep < 0) return;
      navDirection     = 'backward';
      animateNextRender = true;
      state.currentStep = firstStep;
      touchState();
      render();
    });

    secHeader.appendChild(secTitle);
    secHeader.appendChild(editBtn);
    card.appendChild(secHeader);

    // Q & A list
    const list = document.createElement('ul');
    list.className = 'review-qa-list';

    section.questions.forEach((questionItem) => {
      const ans        = state.answers[questionItem.id];
      const answerText = getResponseText(questionItem, ans);

      const li = document.createElement('li');
      li.className = 'review-qa-item';
      li.innerHTML = `
        <p class="review-question-text">${questionItem.order}. ${escapeHtml(questionItem.text)}</p>
        <p class="review-answer-text ${answerText ? '' : 'is-empty'}">${answerText ? escapeHtml(answerText) : 'No response yet'}</p>
      `;
      list.appendChild(li);
    });

    card.appendChild(list);
    panel.appendChild(card);
  });

  elements.panelHost.innerHTML = '';
  elements.panelHost.appendChild(panel);
}

// ─── Navigation handlers ──────────────────────────────────────────────────────
function handlePreviousStep() {
  if (state.currentStep === 0) return;
  navDirection     = 'backward';
  animateNextRender = true;
  state.currentStep -= 1;
  touchState();
  render();
}

async function handleNextStep() {
  const reviewIdx = questionFlow.length;

  if (state.currentStep < reviewIdx) {
    navDirection     = 'forward';
    animateNextRender = true;
    state.currentStep += 1;
    touchState();
    render();
    return;
  }

  await submitResponses();
}

// ─── Submission ───────────────────────────────────────────────────────────────
async function submitResponses() {
  if (submitting) return;
  submitting = true;
  renderFooterActions();

  const payload = buildSubmissionPayload();

  try {
    const response = await fetch(`${API_BASE}/api/submit`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });

    if (!response.ok) {
      let errorMessage = `Submission failed (${response.status}).`;
      try {
        const errPayload = await response.json();
        if (errPayload && typeof errPayload.error === 'string') errorMessage = errPayload.error;
      } catch { /* keep fallback */ }
      throw new Error(errorMessage);
    }

    const result      = await response.json();
    const submittedAt = new Date().toISOString();

    state.lastSubmission = {
      submittedAt,
      submissionId: result.submissionId || '',
      answerCount:  payload.answers.length,
    };
    touchState();

    showSubmitStatus(
      `Submitted successfully at ${formatTimestamp(submittedAt)}${result.submissionId ? ` · ID: ${result.submissionId}` : ''}.`
    );
  } catch (error) {
    showSubmitStatus(error instanceof Error ? error.message : 'Submission failed.', true);
  } finally {
    submitting = false;
    renderFooterActions();
  }
}

// ─── Export ───────────────────────────────────────────────────────────────────
function handleExportJson() {
  const payload  = buildSubmissionPayload();
  const filename = `ttfpp-senior-responses-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  const blob     = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const blobUrl  = URL.createObjectURL(blob);
  const anchor   = document.createElement('a');
  anchor.href     = blobUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(blobUrl);
  showSubmitStatus('JSON export generated. You can ingest this directly into your RAG pipeline.');
}

// ─── Reset ────────────────────────────────────────────────────────────────────
function handleReset() {
  if (!window.confirm('Clear all saved responses and start over?')) return;
  state = createEmptyState();
  recorderStore.clear();
  clearDraft();
  showSubmitStatus('Draft reset. You can start fresh now.');
  animateNextRender = false;
  render();
  updateSaveStatus();
}

// ─── Footer actions ───────────────────────────────────────────────────────────
function renderFooterActions() {
  const isReviewStep = state.currentStep === questionFlow.length;

  elements.prevButton.disabled   = state.currentStep === 0 || submitting;
  elements.resetButton.disabled  = submitting;
  elements.exportButton.disabled = submitting;

  if (isReviewStep) {
    elements.nextButton.innerHTML = submitting
      ? `<span>Submitting…</span>`
      : `<span>Submit responses</span>
         <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>`;
  } else if (state.currentStep === questionFlow.length - 1) {
    elements.nextButton.innerHTML = `<span>Review answers</span>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>`;
  } else {
    elements.nextButton.innerHTML = `<span>Next</span>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>`;
  }

  elements.nextButton.disabled = submitting;
}

// ─── Answer management ────────────────────────────────────────────────────────
function updateAnswer(questionItem, patch, options = {}) {
  const existing = state.answers[questionItem.id] || createAnswerRecord(questionItem);

  const merged = {
    ...existing,
    ...patch,
    questionId:  questionItem.id,
    questionText: questionItem.text,
    answerType:  questionItem.answerType,
    tags:        Array.isArray(questionItem.tags) ? [...questionItem.tags] : [],
    updatedAt:   new Date().toISOString(),
  };

  if (questionItem.answerType === 'radio' || questionItem.answerType === 'select') {
    merged.finalAnswerText = merged.selectedOption || '';
    merged.typedText       = merged.finalAnswerText;
  } else if (questionItem.answerType === 'checkbox') {
    merged.finalAnswerText = Array.isArray(merged.selectedOptions)
      ? merged.selectedOptions.join(', ')
      : '';
    merged.typedText = merged.finalAnswerText;
  } else {
    merged.finalAnswerText = merged.typedText || '';
  }

  state.answers[questionItem.id] = merged;
  refreshAnswerContexts();
  touchState();

  if (options.rerender) {
    render();
    return;
  }

  renderProgressPanel();
  renderSectionChips();
}

function createAnswerRecord(questionItem) {
  return {
    questionId:      questionItem.id,
    questionText:    questionItem.text,
    answerType:      questionItem.answerType,
    typedText:       '',
    transcriptText:  '',
    audioUrl:        '',
    finalAnswerText: '',
    selectedOption:  '',
    selectedOptions: [],
    genderContext:   '',
    programmeContext: '',
    yearGroupContext: '',
    tags:            Array.isArray(questionItem.tags) ? [...questionItem.tags] : [],
    updatedAt:       new Date().toISOString(),
  };
}

function refreshAnswerContexts() {
  const genderContext   = getContextValue('q2');
  const programmeContext = getContextValue('q3');
  const yearGroupContext = getContextValue('q5');
  Object.values(state.answers).forEach((ans) => {
    ans.genderContext    = genderContext;
    ans.programmeContext = programmeContext;
    ans.yearGroupContext = yearGroupContext;
  });
}

function getContextValue(questionId) {
  const ans = state.answers[questionId];
  if (!ans) return '';
  if (ans.selectedOption) return ans.selectedOption;
  return ans.finalAnswerText || '';
}

function getAnsweredCount(section) {
  return section.questions.filter((q) => hasAnswer(q, state.answers[q.id])).length;
}

function hasAnswer(questionItem, answer) {
  if (!answer) return false;
  if (questionItem.answerType === 'checkbox') {
    return Array.isArray(answer.selectedOptions) && answer.selectedOptions.length > 0;
  }
  if (questionItem.answerType === 'radio' || questionItem.answerType === 'select') {
    return Boolean(answer.selectedOption);
  }
  return typeof answer.finalAnswerText === 'string' && answer.finalAnswerText.trim().length > 0;
}

function getResponseText(questionItem, answer) {
  if (!answer) return '';
  if (questionItem.answerType === 'checkbox') {
    return Array.isArray(answer.selectedOptions) ? answer.selectedOptions.join(', ') : '';
  }
  if (questionItem.answerType === 'radio' || questionItem.answerType === 'select') {
    return answer.selectedOption || '';
  }
  return answer.finalAnswerText || '';
}

// ─── Payload builder ──────────────────────────────────────────────────────────
function buildSubmissionPayload() {
  const now                   = new Date().toISOString();
  const activeVisibleSections = getVisibleSections(state.answers);
  const activeVisibleQuestions = activeVisibleSections.flatMap((s) => s.questions);

  const answers = activeVisibleQuestions
    .map((q) => {
      const existing = state.answers[q.id] || createAnswerRecord(q);
      return { ...existing, questionId: q.id, questionText: q.text, answerType: q.answerType, tags: [...(q.tags || [])] };
    })
    .filter((ans) => {
      const q = getQuestionById(ans.questionId);
      return q ? hasAnswer(q, ans) : false;
    });

  const ragChunks = answers.map((ans, i) => ({
    chunkId:         `${ans.questionId}-${i + 1}`,
    questionId:      ans.questionId,
    topic:           ans.tags[0] || 'topic',
    text:            ans.finalAnswerText,
    tags:            ans.tags,
    genderContext:   ans.genderContext,
    programmeContext: ans.programmeContext,
    yearGroupContext: ans.yearGroupContext,
  }));

  return {
    schemaVersion: state.schemaVersion,
    startedAt:     state.startedAt,
    submittedAt:   now,
    respondent: {
      fullName:        state.answers.q1 ? state.answers.q1.finalAnswerText : '',
      genderContext:   getContextValue('q2'),
      programmeContext: getContextValue('q3'),
      yearGroupContext: getContextValue('q5'),
      community:       state.answers.q7 ? state.answers.q7.finalAnswerText : '',
      district:        state.answers.q8 ? state.answers.q8.finalAnswerText : '',
    },
    answers,
    ragChunks,
  };
}

// ─── Save / autosave ──────────────────────────────────────────────────────────
function touchState() {
  state.updatedAt = new Date().toISOString();
  queueSave();
}

function queueSave() {
  if (saveTimer) window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    saveDraft(state);
    updateSaveStatus();
  }, 250);
}

function updateSaveStatus() {
  if (!elements.saveStatus) return;
  elements.saveStatus.textContent = `Saved ${formatTimestamp(state.updatedAt)}`;
  elements.saveStatus.title       = `Last autosaved ${formatTimestamp(state.updatedAt)}`;
}

// ─── Submit status banner ─────────────────────────────────────────────────────
function showSubmitStatus(message, isError = false) {
  if (!elements.submitStatus) return;
  elements.submitStatus.hidden    = false;
  elements.submitStatus.textContent = message;
  elements.submitStatus.className = `submit-status ${isError ? 'is-error' : 'is-ok'}`;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getEncouragementMessage(ratio) {
  if (ratio === 0)    return 'Let\'s get started';
  if (ratio < 0.25)   return 'Great start!';
  if (ratio < 0.5)    return 'Keep going!';
  if (ratio < 0.75)   return 'You\'re doing great';
  if (ratio < 1)      return 'Almost there!';
  return 'Ready to submit';
}

function isMedicineOrPharmacySelected() {
  const prog = getContextValue('q3').toLowerCase();
  return prog === 'medicine' || prog === 'pharmacy';
}

function mergeTranscriptText(questionItem, currentValue, transcriptText) {
  const current = (currentValue || '').trim();
  if (!current) return transcriptText;
  if (questionItem.answerType === 'short_text') return `${current} ${transcriptText}`.trim();
  return `${current}\n${transcriptText}`.trim();
}

function formatTimestamp(isoTimestamp) {
  if (!isoTimestamp) return 'recently';
  const date = new Date(isoTimestamp);
  return date.toLocaleString(undefined, {
    month:  'short', day: 'numeric',
    hour:   '2-digit', minute: '2-digit',
  });
}

function escapeHtml(input) {
  return String(input)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
