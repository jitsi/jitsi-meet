# Orbit Bridge MVP (Standalone)

This is a standalone 2-user bridge web app with long-press activation, Gemini Live transcription, WS relay, translation, and read-aloud playback.

## Terminology
- Speaker: the user currently providing input audio for transcription.
- Listeners: all other users in the meeting at that moment.
- Roles swap when another user speaks.

## Behavior Rules
- Bridge OFF (listener): hear the speaker's original audio.
- Bridge ON (listener): do not hear the speaker's original audio; hear translated read-aloud audio instead.
- Only the active speaker captures mic audio for transcription (Gemini Live listening mode).
- Listener transcription is off while listening.
- Read-aloud playback never feeds transcription.

## Run
From `orbit-bridge-mvp/server`:

```bash
npm install
npm start
```

Open the app:

```
http://127.0.0.1:8080
```

Hold the listening orb for 3 seconds to activate. Speaking is detected automatically. Toggle the translation orb on for a listener and choose a target language. To test with another user, have them join from another device or browser profile.

## Gemini Settings
Set these in `orbit-bridge-mvp/.env` before starting the server:

- `PORT` (optional, default `8080`)
- `GEMINI_API_KEY` (required for Gemini Live transcription and read-aloud)
- `GEMINI_TEXT_MODEL` (optional, default `gemini-2.5-flash`)
- `GEMINI_LISTEN_MODEL` (optional, default `gemini-2.5-flash-native-audio-preview-12-2025`)
- `GEMINI_TTS_MODEL` (optional, default `gemini-2.5-flash-native-audio-preview-12-2025`)

If `GEMINI_API_KEY` is not set, translated text is spoken by the browser speech engine.

## API Shape
Speaker transcript POST (optional fallback):

```json
{
  "meetingId": "default",
  "speakerUserId": "...",
  "seq": 1,
  "text": "hello",
  "sourceLangHint": "en",
  "timestamp": 1710000000000
}
```

WS audio relay (from speaker):

```json
{
  "type": "AUDIO_CHUNK",
  "meetingId": "default",
  "speakerUserId": "...",
  "seq": 12,
  "audioMimeType": "audio/webm;codecs=opus",
  "audioBase64": "..."
}
```

WS PCM input (from speaker, Gemini Live listening):

```json
{
  "type": "PCM_CHUNK",
  "meetingId": "default",
  "audioMimeType": "audio/pcm;rate=16000",
  "audioBase64": "..."
}
```

WS translation + read-aloud (to listener with Bridge ON):

```json
{
  "type": "TTS_AUDIO",
  "meetingId": "default",
  "speakerUserId": "...",
  "seq": 12,
  "translatedText": "...",
  "audioMimeType": "audio/wav",
  "audioChunks": ["..."]
}
```
