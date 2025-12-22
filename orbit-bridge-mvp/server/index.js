import http from 'node:http';
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { GoogleGenAI, Modality } from '@google/genai';
import { WebSocketServer } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const PORT = Number.parseInt(process.env.PORT || '8080', 10);
const PUBLIC_DIR = path.resolve(__dirname, '../client');
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || 'gemini-2.5-flash';
const GEMINI_LISTEN_MODEL = process.env.GEMINI_LISTEN_MODEL || 'gemini-2.5-flash-native-audio-preview-12-2025';
const GEMINI_TTS_MODEL = process.env.GEMINI_TTS_MODEL || 'gemini-2.5-flash-native-audio-preview-12-2025';
const TLS_KEY_PATH = process.env.ORBIT_BRIDGE_TLS_KEY;
const TLS_CERT_PATH = process.env.ORBIT_BRIDGE_TLS_CERT;
const TLS_PEM_PATH = process.env.ORBIT_BRIDGE_TLS_PEM;

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const meetings = new Map();

function getMeeting(meetingId) {
    if (!meetings.has(meetingId)) {
        meetings.set(meetingId, {
            meetingId,
            currentSpeakerUserId: null,
            transcriptSeq: 0,
            liveTranscriber: null,
            users: new Map()
        });
    }
    return meetings.get(meetingId);
}

function sendJson(socket, payload) {
    if (socket.readyState === socket.OPEN) {
        socket.send(JSON.stringify(payload));
    }
}

function broadcast(meeting, payload, skipUserId) {
    for (const [userId, userState] of meeting.users) {
        if (userId === skipUserId) {
            continue;
        }
        sendJson(userState.socket, payload);
    }
}

function sendToListeners(meeting, speakerUserId, payload, bridgeEnabled) {
    for (const [userId, userState] of meeting.users) {
        if (userId === speakerUserId) {
            continue;
        }
        if (bridgeEnabled && !userState.bridgeEnabled) {
            continue;
        }
        if (!bridgeEnabled && userState.bridgeEnabled) {
            continue;
        }
        sendJson(userState.socket, payload);
    }
}

function getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
        case '.html':
            return 'text/html; charset=utf-8';
        case '.js':
            return 'text/javascript; charset=utf-8';
        case '.css':
            return 'text/css; charset=utf-8';
        case '.json':
            return 'application/json; charset=utf-8';
        case '.svg':
            return 'image/svg+xml';
        case '.png':
            return 'image/png';
        case '.jpg':
        case '.jpeg':
            return 'image/jpeg';
        case '.wav':
            return 'audio/wav';
        case '.mp3':
            return 'audio/mpeg';
        default:
            return 'application/octet-stream';
    }
}

function parsePcmMimeType(mimeType) {
    const [typePart, ...params] = mimeType.split(';').map((part) => part.trim());
    const [type, format] = typePart.split('/');
    const options = {
        numChannels: 1,
        sampleRate: 24000,
        bitsPerSample: 16
    };

    if (type !== 'audio' || format !== 'pcm') {
        return options;
    }

    for (const param of params) {
        const [key, value] = param.split('=').map((part) => part.trim());
        if (key === 'rate') {
            const rate = Number.parseInt(value, 10);
            if (!Number.isNaN(rate)) {
                options.sampleRate = rate;
            }
        }
    }

    return options;
}

function createWavHeader(dataLength, options) {
    const {
        numChannels,
        sampleRate,
        bitsPerSample
    } = options;

    const byteRate = sampleRate * numChannels * bitsPerSample / 8;
    const blockAlign = numChannels * bitsPerSample / 8;
    const buffer = Buffer.alloc(44);

    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(36 + dataLength, 4);
    buffer.write('WAVE', 8);
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16);
    buffer.writeUInt16LE(1, 20);
    buffer.writeUInt16LE(numChannels, 22);
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE(byteRate, 28);
    buffer.writeUInt16LE(blockAlign, 32);
    buffer.writeUInt16LE(bitsPerSample, 34);
    buffer.write('data', 36);
    buffer.writeUInt32LE(dataLength, 40);

    return buffer;
}

function pcmBase64ToWavBase64(audioBase64, mimeType) {
    const pcmBuffer = Buffer.from(audioBase64, 'base64');
    const options = parsePcmMimeType(mimeType);
    const wavHeader = createWavHeader(pcmBuffer.length, options);
    const wavBuffer = Buffer.concat([ wavHeader, pcmBuffer ]);
    return wavBuffer.toString('base64');
}

function safePath(requestPath) {
    const cleaned = requestPath.split('?')[0];
    const normalized = path.normalize(cleaned).replace(/^\.\.(\/|\\|$)/, '');
    return path.join(PUBLIC_DIR, normalized);
}

function readJson(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', (chunk) => {
            body += chunk;
            if (body.length > 2 * 1024 * 1024) {
                reject(new Error('Payload too large'));
                req.destroy();
            }
        });
        req.on('end', () => {
            try {
                resolve(JSON.parse(body || '{}'));
            } catch (err) {
                reject(err);
            }
        });
    });
}

async function translateText({ text, targetLanguage, sourceLangHint }) {
    if (!GEMINI_API_KEY) {
        return text;
    }

    const sourceHint = sourceLangHint ? ` Source language hint: ${sourceLangHint}.` : '';
    const prompt = `Translate to ${targetLanguage}. Reply with only the translation.${sourceHint} Text: ${text}`;

    try {
        const response = await ai.models.generateContent({
            model: GEMINI_TEXT_MODEL,
            contents: prompt
        });

        const translated = response?.text?.trim();
        return translated || text;
    } catch (err) {
        return text;
    }
}

function getTextParts(message) {
    const parts = message?.serverContent?.modelTurn?.parts || [];
    return parts
        .map((part) => (typeof part.text === 'string' ? part.text.trim() : ''))
        .filter((text) => text);
}

async function ensureTtsSession(listenerState) {
    if (!GEMINI_API_KEY) {
        return null;
    }
    if (listenerState.ttsSession) {
        return listenerState.ttsSession;
    }

    const session = await ai.live.connect({
        model: GEMINI_TTS_MODEL,
        config: {
            responseModalities: [ Modality.AUDIO ],
            systemInstruction: 'Read aloud the provided text only. Do not add or remove words.'
        },
        callbacks: {
            onmessage: (message) => handleTtsMessage(listenerState, message),
            onerror: () => undefined,
            onclose: () => undefined
        }
    });

    listenerState.ttsSession = session;
    return session;
}

function stopTtsSession(listenerState) {
    if (listenerState.ttsSession) {
        listenerState.ttsSession.close();
    }
    listenerState.ttsSession = null;
    listenerState.ttsQueue = [];
    listenerState.ttsProcessing = false;
    listenerState.ttsCurrent = null;
}

function handleTtsMessage(listenerState, message) {
    if (!listenerState.bridgeEnabled || !listenerState.ttsCurrent) {
        return;
    }

    const parts = message?.serverContent?.modelTurn?.parts || [];
    for (const part of parts) {
        if (part.inlineData?.data) {
            const mimeType = part.inlineData.mimeType || 'audio/pcm;rate=24000';
            const audioBase64 = mimeType.startsWith('audio/pcm')
                ? pcmBase64ToWavBase64(part.inlineData.data, mimeType)
                : part.inlineData.data;
            sendJson(listenerState.socket, {
                type: 'TTS_AUDIO',
                meetingId: listenerState.meetingId,
                speakerUserId: listenerState.ttsCurrent.speakerUserId,
                seq: listenerState.ttsCurrent.seq,
                translatedText: listenerState.ttsCurrent.text,
                audioMimeType: mimeType.startsWith('audio/pcm') ? 'audio/wav' : mimeType,
                audioChunks: [ audioBase64 ]
            });
        }
    }

    if (message?.serverContent?.turnComplete) {
        listenerState.ttsCurrent = null;
        listenerState.ttsProcessing = false;
        processTtsQueue(listenerState);
    }
}

function processTtsQueue(listenerState) {
    if (!listenerState.bridgeEnabled) {
        stopTtsSession(listenerState);
        return;
    }
    const next = listenerState.ttsQueue.shift();
    if (!next) {
        listenerState.ttsProcessing = false;
        return;
    }

    listenerState.ttsProcessing = true;
    listenerState.ttsCurrent = next;

    ensureTtsSession(listenerState).then((session) => {
        if (!session || !listenerState.ttsCurrent) {
            listenerState.ttsProcessing = false;
            return;
        }
        session.sendClientContent({
            turns: [ listenerState.ttsCurrent.text ]
        });
    }).catch(() => {
        listenerState.ttsProcessing = false;
    });
}

function enqueueTts(listenerState, payload) {
    if (!listenerState.bridgeEnabled) {
        return;
    }

    if (!GEMINI_API_KEY) {
        sendJson(listenerState.socket, {
            type: 'TTS_AUDIO',
            meetingId: listenerState.meetingId,
            speakerUserId: payload.speakerUserId,
            seq: payload.seq,
            translatedText: payload.text,
            audioMimeType: null,
            audioChunks: []
        });
        return;
    }

    listenerState.ttsQueue.push(payload);

    if (!listenerState.ttsProcessing) {
        processTtsQueue(listenerState);
    }
}

function stopLiveTranscriber(meeting) {
    if (meeting.liveTranscriber?.session) {
        meeting.liveTranscriber.session.close();
    }
    meeting.liveTranscriber = null;
}

async function startLiveTranscriber(meeting, speakerUserId) {
    if (!GEMINI_API_KEY) {
        return;
    }
    if (meeting.liveTranscriber?.speakerUserId === speakerUserId) {
        return;
    }

    stopLiveTranscriber(meeting);

    const session = await ai.live.connect({
        model: GEMINI_LISTEN_MODEL,
        config: {
            responseModalities: [ Modality.TEXT ],
            inputAudioTranscription: {},
            systemInstruction: 'Transcribe the speaker audio only. Return just the transcript without extra words.'
        },
        callbacks: {
            onmessage: (message) => handleLiveMessage(meeting, speakerUserId, message),
            onerror: () => undefined,
            onclose: () => undefined
        }
    });

    meeting.liveTranscriber = {
        speakerUserId,
        session,
        buffer: []
    };
}

function handleLiveMessage(meeting, speakerUserId, message) {
    if (meeting.currentSpeakerUserId !== speakerUserId) {
        return;
    }
    const transcription = message?.serverContent?.inputTranscription?.text;
    const texts = transcription ? [ transcription ] : getTextParts(message);
    if (!meeting.liveTranscriber || meeting.liveTranscriber.speakerUserId !== speakerUserId) {
        return;
    }
    texts.forEach((text) => {
        if (text) {
            meeting.liveTranscriber.buffer.push(text);
        }
    });
}

function flushLiveTranscriber(meeting, speakerUserId) {
    if (!meeting.liveTranscriber || meeting.liveTranscriber.speakerUserId !== speakerUserId) {
        return;
    }
    const combined = meeting.liveTranscriber.buffer.join(' ').trim();
    meeting.liveTranscriber.buffer = [];
    if (!combined) {
        return;
    }
    void processTranscript({
        meeting,
        speakerUserId,
        text: combined,
        sourceLangHint: null
    });
}

async function handleTranscript({ meeting, payload, res }) {
    const {
        speakerUserId,
        text,
        sourceLangHint
    } = payload;

    if (!meeting || meeting.currentSpeakerUserId !== speakerUserId) {
        res.writeHead(409, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false }));
        return;
    }

    await processTranscript({
        meeting,
        speakerUserId,
        text,
        sourceLangHint
    });

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
}

async function processTranscript({ meeting, speakerUserId, text, sourceLangHint }) {
    if (!text) {
        return;
    }

    meeting.transcriptSeq += 1;
    const seq = meeting.transcriptSeq;
    const timestamp = Date.now();

    broadcast(meeting, {
        type: 'TRANSCRIPT',
        meetingId: meeting.meetingId,
        speakerUserId,
        seq,
        text,
        timestamp
    });

    const listeners = Array.from(meeting.users.values()).filter((userState) => (
        userState.userId !== speakerUserId && userState.bridgeEnabled
    ));

    await Promise.all(listeners.map(async (listenerState) => {
        const translatedText = await translateText({
            text,
            targetLanguage: listenerState.targetLanguage,
            sourceLangHint
        });

        enqueueTts(listenerState, {
            speakerUserId,
            seq,
            text: translatedText
        });
    }));
}

function createServer(handler) {
    if (TLS_PEM_PATH && fs.existsSync(TLS_PEM_PATH)) {
        const pem = fs.readFileSync(TLS_PEM_PATH);
        return https.createServer({ key: pem, cert: pem }, handler);
    }
    if (TLS_KEY_PATH && TLS_CERT_PATH && fs.existsSync(TLS_KEY_PATH) && fs.existsSync(TLS_CERT_PATH)) {
        return https.createServer({
            key: fs.readFileSync(TLS_KEY_PATH),
            cert: fs.readFileSync(TLS_CERT_PATH)
        }, handler);
    }
    return http.createServer(handler);
}

const server = createServer(async (req, res) => {
    if (!req.url) {
        res.writeHead(400);
        res.end();
        return;
    }

    if (req.method === 'POST' && req.url.startsWith('/api/transcript')) {
        try {
            const payload = await readJson(req);
            const meetingId = payload.meetingId || 'default';
            const meeting = getMeeting(meetingId);
            await handleTranscript({ meeting, payload, res });
        } catch (err) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: false }));
        }
        return;
    }

    const filePath = req.url === '/' ? path.join(PUBLIC_DIR, 'index.html') : safePath(req.url);

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Not found');
            return;
        }
        res.writeHead(200, { 'Content-Type': getMimeType(filePath) });
        res.end(data);
    });
});

const wss = new WebSocketServer({ server });

wss.on('connection', (socket, req) => {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const meetingId = url.searchParams.get('meetingId') || 'default';
    const userId = url.searchParams.get('userId') || randomUUID();
    const meeting = getMeeting(meetingId);

    const userState = {
        socket,
        userId,
        meetingId,
        bridgeEnabled: false,
        targetLanguage: 'en',
        isSpeaking: false,
        ttsSession: null,
        ttsQueue: [],
        ttsProcessing: false,
        ttsCurrent: null
    };

    meeting.users.set(userId, userState);

    sendJson(socket, {
        type: 'WELCOME',
        meetingId,
        userId,
        currentSpeakerUserId: meeting.currentSpeakerUserId
    });

    broadcast(meeting, {
        type: 'USER_LIST',
        meetingId,
        users: Array.from(meeting.users.keys())
    });

    socket.on('message', (data) => {
        let message;
        try {
            message = JSON.parse(data.toString());
        } catch (err) {
            return;
        }

        switch (message.type) {
            case 'SET_BRIDGE': {
                userState.bridgeEnabled = Boolean(message.bridgeEnabled);
                userState.targetLanguage = message.targetLanguage || 'en';
                if (!userState.bridgeEnabled) {
                    stopTtsSession(userState);
                }
                sendJson(socket, {
                    type: 'BRIDGE_UPDATED',
                    meetingId,
                    bridgeEnabled: userState.bridgeEnabled,
                    targetLanguage: userState.targetLanguage
                });
                break;
            }
            case 'SPEAK_START': {
                if (!meeting.currentSpeakerUserId || meeting.currentSpeakerUserId === userId) {
                    meeting.currentSpeakerUserId = userId;
                    meeting.transcriptSeq = 0;
                    userState.isSpeaking = true;
                    broadcast(meeting, {
                        type: 'SPEAKER_UPDATE',
                        meetingId,
                        currentSpeakerUserId: meeting.currentSpeakerUserId
                    });
                    startLiveTranscriber(meeting, userId).catch(() => undefined);
                } else {
                    sendJson(socket, {
                        type: 'SPEAK_DENY',
                        meetingId,
                        currentSpeakerUserId: meeting.currentSpeakerUserId
                    });
                }
                break;
            }
            case 'SPEAK_END': {
                if (meeting.currentSpeakerUserId === userId) {
                    meeting.currentSpeakerUserId = null;
                    userState.isSpeaking = false;
                    flushLiveTranscriber(meeting, userId);
                    stopLiveTranscriber(meeting);
                    broadcast(meeting, {
                        type: 'SPEAKER_UPDATE',
                        meetingId,
                        currentSpeakerUserId: null
                    });
                }
                break;
            }
            case 'AUDIO_CHUNK': {
                if (meeting.currentSpeakerUserId !== userId) {
                    break;
                }
                sendToListeners(meeting, userId, {
                    type: 'AUDIO_CHUNK',
                    meetingId,
                    speakerUserId: userId,
                    seq: message.seq,
                    audioMimeType: message.audioMimeType,
                    audioBase64: message.audioBase64
                }, false);
                break;
            }
            case 'PCM_CHUNK': {
                if (meeting.currentSpeakerUserId !== userId) {
                    break;
                }
                if (!meeting.liveTranscriber?.session) {
                    break;
                }
                meeting.liveTranscriber.session.sendRealtimeInput({
                    audio: {
                        data: message.audioBase64,
                        mimeType: message.audioMimeType || 'audio/pcm;rate=16000'
                    }
                });
                break;
            }
            default:
                break;
        }
    });

    socket.on('close', () => {
        meeting.users.delete(userId);
        stopTtsSession(userState);
        if (meeting.currentSpeakerUserId === userId) {
            meeting.currentSpeakerUserId = null;
            flushLiveTranscriber(meeting, userId);
            stopLiveTranscriber(meeting);
            broadcast(meeting, {
                type: 'SPEAKER_UPDATE',
                meetingId,
                currentSpeakerUserId: null
            });
        }
        broadcast(meeting, {
            type: 'USER_LIST',
            meetingId,
            users: Array.from(meeting.users.keys())
        });
    });
});

server.listen(PORT, () => {
    console.log(`Orbit bridge MVP server listening on ${PORT}`);
});
