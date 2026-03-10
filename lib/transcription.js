export async function transcribeAudioBlob({ audioBlob, questionId, apiBase = '' }) {
  const normalizedBase = typeof apiBase === 'string' ? apiBase.replace(/\/+$/, '') : '';
  const encodedQuestionId = encodeURIComponent(questionId || '');
  const endpoint = normalizedBase
    ? `${normalizedBase}/api/transcribe?questionId=${encodedQuestionId}`
    : `/api/transcribe?questionId=${encodedQuestionId}`;

  const attempts = [
    { name: 'raw-audio', run: () => sendRawAudio(endpoint, audioBlob) },
    { name: 'multipart', run: () => sendMultipartAudio(endpoint, audioBlob, questionId) },
  ];

  let lastError = null;

  for (let index = 0; index < attempts.length; index += 1) {
    const attempt = attempts[index];
    const isLastAttempt = index === attempts.length - 1;

    try {
      const response = await attempt.run();
      if (!response.ok) {
        const err = await buildResponseError(response);
        lastError = err;

        if (!isLastAttempt && shouldRetryWithAlternateUpload(response.status, err.message)) {
          continue;
        }
        throw err;
      }

      const payload = await response.json().catch(() => ({}));
      return {
        transcript: typeof payload.transcript === 'string' ? payload.transcript : '',
        audioUrl: typeof payload.audioUrl === 'string' ? payload.audioUrl : '',
        provider: typeof payload.provider === 'string' ? payload.provider : 'unknown',
      };
    } catch (error) {
      const err =
        error instanceof Error ? error : new Error('Transcription request failed.');
      lastError = err;
      if (!isLastAttempt) {
        continue;
      }
      throw err;
    }
  }

  throw lastError || new Error('Transcription failed.');
}

function normalizeAudioMimeType(type) {
  const input = String(type || '').toLowerCase().trim();
  if (!input) return 'audio/webm';
  if (input.startsWith('audio/webm')) return 'audio/webm';
  if (input.startsWith('audio/mp4')) return 'audio/mp4';
  if (input.startsWith('audio/ogg')) return 'audio/ogg';
  if (input.startsWith('audio/wav')) return 'audio/wav';
  if (input.startsWith('audio/x-wav')) return 'audio/wav';
  if (input.startsWith('audio/mpeg')) return 'audio/mpeg';

  const cleaned = input.split(';')[0].trim();
  return cleaned || 'application/octet-stream';
}

function getAudioExtension(mimeType) {
  switch (mimeType) {
    case 'audio/webm':
      return '.webm';
    case 'audio/mp4':
      return '.m4a';
    case 'audio/ogg':
      return '.ogg';
    case 'audio/wav':
      return '.wav';
    case 'audio/mpeg':
      return '.mp3';
    default:
      return '.bin';
  }
}

async function sendRawAudio(endpoint, audioBlob) {
  const mimeType = normalizeAudioMimeType(audioBlob?.type);
  return fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': mimeType,
    },
    body: audioBlob,
  });
}

async function sendMultipartAudio(endpoint, audioBlob, questionId) {
  const mimeType = normalizeAudioMimeType(audioBlob?.type);
  const ext = getAudioExtension(mimeType);
  const formData = new FormData();
  formData.append('audio', audioBlob, `recording${ext}`);
  if (questionId) {
    formData.append('questionId', String(questionId));
  }

  return fetch(endpoint, {
    method: 'POST',
    body: formData,
  });
}

async function buildResponseError(response) {
  let message = `Transcription failed (${response.status}).`;
  let payload = null;

  try {
    payload = await response.json();
  } catch {
    try {
      const text = await response.text();
      if (text && text.trim()) {
        message = `${message} ${text.trim()}`;
      }
    } catch {
      // Keep fallback message.
    }
    return new Error(message);
  }

  if (payload && typeof payload.error === 'string') {
    message = payload.error;
    if (typeof payload.detail === 'string' && payload.detail) {
      message = `${message}: ${payload.detail}`;
    } else if (typeof payload.hint === 'string' && payload.hint) {
      message = `${message}: ${payload.hint}`;
    }
  }

  return new Error(message);
}

function shouldRetryWithAlternateUpload(status, message) {
  if (status === 400 || status === 415 || status === 422 || status === 502) {
    return true;
  }

  const msg = String(message || '').toLowerCase();
  return (
    msg.includes('audio file is required') ||
    msg.includes('unsupported content type') ||
    msg.includes('failed to decode audio file') ||
    msg.includes('failed to fetch')
  );
}
