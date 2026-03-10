export async function transcribeAudioBlob({ audioBlob, questionId, apiBase = '' }) {
  const normalizedBase = typeof apiBase === 'string' ? apiBase.replace(/\/+$/, '') : '';
  const encodedQuestionId = encodeURIComponent(questionId || '');
  const endpoint = normalizedBase
    ? `${normalizedBase}/api/transcribe?questionId=${encodedQuestionId}`
    : `/api/transcribe?questionId=${encodedQuestionId}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': audioBlob.type || 'audio/webm',
    },
    body: audioBlob,
  });

  if (!response.ok) {
    let message = `Transcription failed (${response.status}).`;

    try {
      const errorPayload = await response.json();
      if (errorPayload && typeof errorPayload.error === 'string') {
        message = errorPayload.error;
        if (typeof errorPayload.detail === 'string' && errorPayload.detail) {
          message = `${message}: ${errorPayload.detail}`;
        } else if (typeof errorPayload.hint === 'string' && errorPayload.hint) {
          message = `${message}: ${errorPayload.hint}`;
        }
      }
    } catch {
      // Ignore parsing errors and keep fallback message.
    }

    throw new Error(message);
  }

  const payload = await response.json();

  return {
    transcript: typeof payload.transcript === 'string' ? payload.transcript : '',
    audioUrl: typeof payload.audioUrl === 'string' ? payload.audioUrl : '',
    provider: typeof payload.provider === 'string' ? payload.provider : 'unknown',
  };
}
