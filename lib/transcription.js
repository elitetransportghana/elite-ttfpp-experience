export async function transcribeAudioBlob({ audioBlob, questionId, apiBase = '' }) {
  const formData = new FormData();
  const filename = `${questionId || 'answer'}-${Date.now()}.webm`;
  formData.append('audio', audioBlob, filename);
  formData.append('questionId', questionId || '');

  const response = await fetch(`${apiBase}/api/transcribe`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    let message = `Transcription failed (${response.status}).`;

    try {
      const errorPayload = await response.json();
      if (errorPayload && typeof errorPayload.error === 'string') {
        message = errorPayload.error;
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
