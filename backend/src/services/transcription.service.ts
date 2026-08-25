import { azureOpenAI, SPEECH_DEPLOYMENT } from '../config/azure-openai.js';
import { AppError } from '../utils/errors.js';

/** Whisper rejects payloads over 25MB; base64 inflates bytes by ~4/3. */
const MAX_AUDIO_BYTES = 25 * 1024 * 1024;

export const transcriptionService = {
  /**
   * Speech -> text. Nothing more.
   *
   * This used to be `voiceToTask`, which transcribed and then asked a chat
   * model to shape the text into a card. The shaping is gone: the transcript
   * pre-fills the Kata title and description, and the user (or their agent,
   * over MCP) decides what it should become. We transcribe because a phone
   * cannot; we do not interpret, because their agent does it better.
   */
  async transcribe(audioBase64: string): Promise<{ transcript: string }> {
    const audioBuffer = Buffer.from(audioBase64, 'base64');

    if (audioBuffer.byteLength === 0) {
      throw AppError.validationError('Audio payload was empty.');
    }
    if (audioBuffer.byteLength > MAX_AUDIO_BYTES) {
      throw AppError.validationError(
        'Audio is too long — keep voice capture under 25MB.',
      );
    }

    const transcription = await azureOpenAI.audio.transcriptions.create({
      file: new File([new Uint8Array(audioBuffer)], 'audio.webm', { type: 'audio/webm' }),
      model: SPEECH_DEPLOYMENT,
    });

    return { transcript: transcription.text };
  },
};
