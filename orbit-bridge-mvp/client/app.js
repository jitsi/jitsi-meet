const meetingId = new URLSearchParams(window.location.search).get('meeting') || 'default';
const userId = (crypto.randomUUID && crypto.randomUUID()) || `user-${Math.random().toString(36).slice(2, 10)}`;

const userIdDisplay = document.getElementById('userIdDisplay');
const roleDisplay = document.getElementById('roleDisplay');
const speakerDisplay = document.getElementById('speakerDisplay');
const languageSelect = document.getElementById('languageSelect');
const transcriptList = document.getElementById('transcriptList');
const speakerAudio = document.getElementById('speakerAudio');
const listenOrbStack = document.getElementById('listenOrbStack');
const listenOrbButton = document.getElementById('listenOrbButton');
const listenOrbLabel = document.getElementById('listenOrbLabel');
const translateOrbStack = document.getElementById('translateOrbStack');
const translateOrbButton = document.getElementById('translateOrbButton');
const translateOrbLabel = document.getElementById('translateOrbLabel');

const state = {
    meetingId,
    userId,
    currentSpeakerUserId: null,
    isSpeaker: false,
    bridgeEnabled: false,
    targetLanguage: languageSelect.value,
    audioSeq: 0,
    isActivated: false,
    activationTimer: null,
    pendingSpeak: false,
    pendingEnd: false,
    speechStartAt: 0,
    recorder: null,
    recorderStream: null,
    recorderMimeType: null,
    micStream: null,
    audioContext: null,
    pcmProcessor: null,
    pcmGain: null,
    visualizerContext: null,
    visualizerAnalyser: null,
    visualizerSource: null,
    visualizerRaf: null,
    visualizerLevel: 0,
    noiseFloor: 0.02,
    isTalking: false,
    lastTalkAt: 0,
    supernovaTimer: null,
    pendingPcm: [],
    pendingAudio: [],
    speakerAudioMimeType: null,
    mediaSource: null,
    sourceBuffer: null,
    audioQueue: [],
    ttsContext: null,
    ttsScheduleTime: 0,
    ttsSources: [],
    ttsActiveCount: 0,
    ttsQueue: [],
    ttsPlaying: false
};

userIdDisplay.textContent = userId;
listenOrbLabel.textContent = '';
translateOrbLabel.textContent = '';
translateOrbButton.disabled = true;
languageSelect.disabled = true;

const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
let ws = null;

function isWsOpen() {
    return ws && ws.readyState === WebSocket.OPEN;
}

function setRole(isSpeaker) {
    state.isSpeaker = isSpeaker;
    roleDisplay.textContent = isSpeaker ? 'Speaker' : 'Listener';
    if (isSpeaker) {
        stopTtsQueue();
    }
    updateAudioRouting();
}

function setSpeakerDisplay() {
    if (!state.currentSpeakerUserId) {
        speakerDisplay.textContent = 'None';
        return;
    }
    if (state.currentSpeakerUserId === state.userId) {
        speakerDisplay.textContent = 'You';
        return;
    }
    speakerDisplay.textContent = state.currentSpeakerUserId;
}

function updateAudioRouting() {
    const shouldMute = state.bridgeEnabled || state.isSpeaker;
    speakerAudio.muted = shouldMute;
    if (state.bridgeEnabled) {
        clearSpeakerAudio();
    } else {
        stopTtsQueue();
    }
    if (!shouldMute) {
        speakerAudio.play().catch(() => undefined);
    }
}

function connectWebSocket() {
    if (ws) {
        return;
    }
    ws = new WebSocket(`${wsProtocol}://${window.location.host}/ws?meetingId=${meetingId}&userId=${userId}`);

    ws.addEventListener('open', () => {
        translateOrbButton.disabled = false;
        languageSelect.disabled = false;
        syncBridgeState();
    });

    ws.addEventListener('message', handleWsMessage);

    ws.addEventListener('close', () => {
        ws = null;
        translateOrbButton.disabled = true;
        languageSelect.disabled = true;
    });
}

function handleWsMessage(event) {
    let message;
    try {
        message = JSON.parse(event.data);
    } catch (err) {
        return;
    }

    switch (message.type) {
        case 'WELCOME': {
            state.currentSpeakerUserId = message.currentSpeakerUserId;
            setRole(state.currentSpeakerUserId === state.userId);
            setSpeakerDisplay();
            break;
        }
        case 'SPEAKER_UPDATE': {
            state.currentSpeakerUserId = message.currentSpeakerUserId;
            setRole(state.currentSpeakerUserId === state.userId);
            setSpeakerDisplay();
            state.pendingSpeak = false;
            state.pendingEnd = false;
            state.speechStartAt = 0;
            if (state.isSpeaker) {
                startSpeakerCapture().catch(() => undefined);
                state.lastTalkAt = performance.now();
            } else {
                stopSpeakerCapture();
            }
            break;
        }
        case 'SPEAK_DENY': {
            state.pendingSpeak = false;
            state.speechStartAt = 0;
            break;
        }
        case 'USER_LIST':
            break;
        case 'TRANSCRIPT': {
            appendTranscript(message);
            break;
        }
        case 'TTS_AUDIO': {
            enqueueTts(message.translatedText, message.audioMimeType, message.audioChunks);
            break;
        }
        case 'AUDIO_CHUNK': {
            if (state.bridgeEnabled || state.isSpeaker) {
                break;
            }
            if (!message.audioBase64 || !message.audioMimeType) {
                break;
            }
            if (!state.mediaSource || state.speakerAudioMimeType !== message.audioMimeType) {
                initSpeakerAudio(message.audioMimeType);
            }
            const bytes = bytesFromBase64(message.audioBase64);
            state.audioQueue.push(bytes);
            appendSpeakerChunk();
            break;
        }
        default:
            break;
    }
}

function appendTranscript({ speakerUserId, text }) {
    const item = document.createElement('div');
    item.className = 'transcript-item';
    const label = speakerUserId === state.userId ? 'Speaker (You)' : `Speaker ${speakerUserId}`;
    const strong = document.createElement('strong');
    strong.textContent = `${label}:`;
    item.appendChild(strong);
    item.appendChild(document.createTextNode(` ${text}`));
    transcriptList.appendChild(item);
    transcriptList.scrollTop = transcriptList.scrollHeight;
}

function pickRecorderMimeType() {
    const options = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus'
    ];
    return options.find((type) => MediaRecorder.isTypeSupported(type)) || '';
}

function base64FromBlob(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const dataUrl = reader.result || '';
            const base64 = String(dataUrl).split(',')[1] || '';
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

function bytesFromBase64(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

function base64FromBytes(bytes) {
    let binary = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.subarray(i, i + chunkSize);
        binary += String.fromCharCode(...chunk);
    }
    return btoa(binary);
}

function downsampleBuffer(buffer, inputRate, outputRate) {
    if (outputRate === inputRate) {
        return buffer;
    }
    const ratio = inputRate / outputRate;
    const newLength = Math.round(buffer.length / ratio);
    const result = new Float32Array(newLength);
    let offsetBuffer = 0;
    for (let i = 0; i < newLength; i += 1) {
        const nextOffsetBuffer = Math.round((i + 1) * ratio);
        let sum = 0;
        let count = 0;
        for (let j = offsetBuffer; j < nextOffsetBuffer && j < buffer.length; j += 1) {
            sum += buffer[j];
            count += 1;
        }
        result[i] = count ? sum / count : 0;
        offsetBuffer = nextOffsetBuffer;
    }
    return result;
}

function floatTo16BitPCM(floatBuffer) {
    const output = new DataView(new ArrayBuffer(floatBuffer.length * 2));
    let offset = 0;
    for (let i = 0; i < floatBuffer.length; i += 1) {
        let sample = Math.max(-1, Math.min(1, floatBuffer[i]));
        sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        output.setInt16(offset, sample, true);
        offset += 2;
    }
    return new Uint8Array(output.buffer);
}

async function ensureMicStream() {
    if (state.micStream) {
        return state.micStream;
    }
    state.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    return state.micStream;
}

function stopMicStream() {
    if (!state.micStream) {
        return;
    }
    state.micStream.getTracks().forEach((track) => track.stop());
    state.micStream = null;
}

function startPcmCapture(stream) {
    if (state.audioContext || !stream) {
        return;
    }
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioContext = new AudioContext();
    audioContext.resume().catch(() => undefined);
    const source = audioContext.createMediaStreamSource(stream);
    const processor = audioContext.createScriptProcessor(4096, 1, 1);
    const gain = audioContext.createGain();
    gain.gain.value = 0;

    processor.onaudioprocess = (event) => {
        if (!isWsOpen()) {
            return;
        }
        const input = event.inputBuffer.getChannelData(0);
        const downsampled = downsampleBuffer(input, audioContext.sampleRate, 16000);
        const pcm = floatTo16BitPCM(downsampled);
        const audioBase64 = base64FromBytes(pcm);
        ws.send(JSON.stringify({
            type: 'PCM_CHUNK',
            meetingId: state.meetingId,
            audioMimeType: 'audio/pcm;rate=16000',
            audioBase64
        }));
    };

    source.connect(processor);
    processor.connect(gain);
    gain.connect(audioContext.destination);

    state.audioContext = audioContext;
    state.pcmProcessor = processor;
    state.pcmGain = gain;
}

function stopPcmCapture() {
    if (state.pcmProcessor) {
        state.pcmProcessor.disconnect();
        state.pcmProcessor.onaudioprocess = null;
    }
    if (state.pcmGain) {
        state.pcmGain.disconnect();
    }
    if (state.audioContext) {
        state.audioContext.close().catch(() => undefined);
    }
    state.audioContext = null;
    state.pcmProcessor = null;
    state.pcmGain = null;
}

function setOrbVisuals(level) {
    const clamped = Math.min(1, Math.max(0, level));
    const hue = 210 + clamped * 90;
    const scale = 1 + clamped * 0.18;
    listenOrbStack.style.setProperty('--orb-hue', `${Math.round(hue)}`);
    listenOrbStack.style.setProperty('--orb-scale', scale.toFixed(3));
}

function triggerSupernova() {
    if (state.supernovaTimer) {
        clearTimeout(state.supernovaTimer);
    }
    listenOrbStack.classList.add('supernova');
    state.supernovaTimer = setTimeout(() => {
        listenOrbStack.classList.remove('supernova');
        state.supernovaTimer = null;
    }, 900);
}

function startVisualizer(stream) {
    if (state.visualizerContext || !stream) {
        return;
    }
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 1024;
    const source = audioContext.createMediaStreamSource(stream);

    source.connect(analyser);
    audioContext.resume().catch(() => undefined);

    const data = new Uint8Array(analyser.fftSize);
    const update = () => {
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i += 1) {
            const value = (data[i] - 128) / 128;
            sum += value * value;
        }
        const rms = Math.sqrt(sum / data.length);
        const level = Math.min(1, rms * 3.5);
        state.visualizerLevel = (state.visualizerLevel * 0.8) + (level * 0.2);

        if (state.isActivated) {
            setOrbVisuals(state.visualizerLevel);
        }

        const now = performance.now();
        const talking = state.visualizerLevel > 0.08;
        if (talking) {
            state.lastTalkAt = now;
            if (!state.isTalking) {
                state.isTalking = true;
                listenOrbStack.classList.add('talking');
            }
        } else if (state.isTalking && now - state.lastTalkAt > 500) {
            state.isTalking = false;
            listenOrbStack.classList.remove('talking');
        }

        if (state.isActivated && isWsOpen()) {
            const startThreshold = 0.12;
            const endThreshold = 0.06;
            const loudEnough = state.visualizerLevel > startThreshold;
            const quietEnough = state.visualizerLevel < endThreshold;

            if (!state.isSpeaker && !state.pendingSpeak && !state.currentSpeakerUserId) {
                if (loudEnough) {
                    if (!state.speechStartAt) {
                        state.speechStartAt = now;
                    } else if (now - state.speechStartAt > 180) {
                        state.pendingSpeak = true;
                        state.speechStartAt = 0;
                        sendSpeakStart();
                    }
                } else {
                    state.speechStartAt = 0;
                }
            }

            if (state.isSpeaker && !state.pendingEnd) {
                if (loudEnough) {
                    state.lastTalkAt = now;
                }
                if (quietEnough && now - state.lastTalkAt > 650) {
                    state.pendingEnd = true;
                    sendSpeakEnd();
                    state.isTalking = false;
                    listenOrbStack.classList.remove('talking');
                    triggerSupernova();
                }
            }
        }

        state.visualizerRaf = requestAnimationFrame(update);
    };

    state.visualizerContext = audioContext;
    state.visualizerAnalyser = analyser;
    state.visualizerSource = source;
    state.visualizerRaf = requestAnimationFrame(update);
}

function activateOrb() {
    if (state.isActivated) {
        return;
    }
    state.isActivated = true;
    listenOrbStack.classList.add('active');
    listenOrbButton.setAttribute('aria-pressed', 'true');
    listenOrbButton.disabled = true;
    listenOrbLabel.textContent = 'Listening';
    updateTranslateOrb();
    connectWebSocket();
    ensureMicStream()
        .then((stream) => startVisualizer(stream))
        .catch(() => undefined);
}

function initSpeakerAudio(mimeType) {
    clearSpeakerAudio();
    state.speakerAudioMimeType = mimeType;
    state.mediaSource = new MediaSource();
    speakerAudio.src = URL.createObjectURL(state.mediaSource);
    state.mediaSource.addEventListener('sourceopen', () => {
        if (!state.mediaSource) {
            return;
        }
        state.sourceBuffer = state.mediaSource.addSourceBuffer(mimeType);
        state.sourceBuffer.addEventListener('updateend', appendSpeakerChunk);
        appendSpeakerChunk();
    }, { once: true });
}

function clearSpeakerAudio() {
    state.audioQueue = [];
    if (state.sourceBuffer) {
        try {
            state.sourceBuffer.abort();
        } catch (err) {
            // Ignore abort errors when resetting.
        }
    }
    state.sourceBuffer = null;
    state.mediaSource = null;
    state.speakerAudioMimeType = null;
    speakerAudio.removeAttribute('src');
}

function appendSpeakerChunk() {
    if (!state.sourceBuffer || state.sourceBuffer.updating) {
        return;
    }
    const nextChunk = state.audioQueue.shift();
    if (!nextChunk) {
        return;
    }
    state.sourceBuffer.appendBuffer(nextChunk);
}

function startRecorder(stream) {
    if (state.recorder || !stream) {
        return;
    }
    state.recorderStream = stream;

    const mimeType = pickRecorderMimeType();
    state.recorderMimeType = mimeType || stream.getAudioTracks()[0]?.getSettings()?.mimeType || 'audio/webm';

    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    state.recorder = recorder;

    recorder.addEventListener('dataavailable', async (event) => {
        if (!event.data || !event.data.size) {
            return;
        }
        if (!isWsOpen()) {
            return;
        }
        const audioBase64 = await base64FromBlob(event.data);
        state.audioSeq += 1;
        ws.send(JSON.stringify({
            type: 'AUDIO_CHUNK',
            meetingId: state.meetingId,
            seq: state.audioSeq,
            audioMimeType: state.recorderMimeType,
            audioBase64
        }));
    });

    recorder.addEventListener('stop', () => {
        state.recorder = null;
    });

    recorder.start(250);
}

function stopRecorder() {
    if (!state.recorder) {
        return;
    }
    state.recorder.stop();
    state.recorderStream = null;
}

async function startSpeakerCapture() {
    const stream = await ensureMicStream();
    startRecorder(stream);
    startPcmCapture(stream);
}

function stopSpeakerCapture() {
    stopRecorder();
    stopPcmCapture();
    if (!state.visualizerContext) {
        stopMicStream();
    }
}

function stopTtsQueue() {
    state.ttsQueue = [];
    state.ttsPlaying = false;
    translateOrbStack.classList.remove('talking');
    if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
    }
}

function playNextTts() {
    if (state.ttsPlaying) {
        return;
    }
    const item = state.ttsQueue.shift();
    if (!item) {
        translateOrbStack.classList.remove('talking');
        return;
    }

    state.ttsPlaying = true;
    translateOrbStack.classList.add('talking');

    if (item.audioBase64) {
        const audio = new Audio(`data:${item.audioMimeType};base64,${item.audioBase64}`);
        audio.onended = () => {
            state.ttsPlaying = false;
            playNextTts();
        };
        audio.onerror = () => {
            state.ttsPlaying = false;
            playNextTts();
        };
        audio.play().catch(() => {
            state.ttsPlaying = false;
            playNextTts();
        });
        return;
    }

    if (item.text && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(item.text);
        utterance.lang = state.targetLanguage;
        utterance.onend = () => {
            state.ttsPlaying = false;
            playNextTts();
        };
        speechSynthesis.speak(utterance);
        return;
    }

    state.ttsPlaying = false;
    playNextTts();
}

function enqueueTts(translatedText, audioMimeType, audioChunks) {
    if (!state.bridgeEnabled || state.userId === state.currentSpeakerUserId) {
        return;
    }
    if (audioChunks && audioChunks.length) {
        audioChunks.forEach((chunk) => {
            state.ttsQueue.push({
                audioMimeType: audioMimeType || 'audio/mpeg',
                audioBase64: chunk
            });
        });
    } else if (translatedText) {
        state.ttsQueue.push({ text: translatedText });
    }
    playNextTts();
}

function syncBridgeState() {
    if (!isWsOpen()) {
        return;
    }
    ws.send(JSON.stringify({
        type: 'SET_BRIDGE',
        meetingId: state.meetingId,
        bridgeEnabled: state.bridgeEnabled,
        targetLanguage: state.targetLanguage
    }));
}

function sendSpeakStart() {
    if (!isWsOpen()) {
        return;
    }
    ws.send(JSON.stringify({
        type: 'SPEAK_START',
        meetingId: state.meetingId
    }));
}

function sendSpeakEnd() {
    if (!isWsOpen()) {
        return;
    }
    ws.send(JSON.stringify({
        type: 'SPEAK_END',
        meetingId: state.meetingId
    }));
}

function playChime() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = 640;
    gain.gain.value = 0.0001;
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    gain.gain.exponentialRampToValueAtTime(0.18, audioContext.currentTime + 0.03);
    oscillator.frequency.exponentialRampToValueAtTime(880, audioContext.currentTime + 0.18);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.28);
    oscillator.stop(audioContext.currentTime + 0.3);
    oscillator.onended = () => audioContext.close().catch(() => undefined);
}

function updateTranslateOrb() {
    translateOrbStack.classList.toggle('active', state.bridgeEnabled);
    translateOrbLabel.textContent = state.bridgeEnabled ? 'Translate' : '';
    translateOrbButton.setAttribute('aria-pressed', state.bridgeEnabled ? 'true' : 'false');
    if (!state.bridgeEnabled) {
        translateOrbStack.classList.remove('talking');
    }
}

translateOrbButton.addEventListener('click', () => {
    if (!state.isActivated) {
        return;
    }
    state.bridgeEnabled = !state.bridgeEnabled;
    updateAudioRouting();
    updateTranslateOrb();
    syncBridgeState();
});

languageSelect.addEventListener('change', () => {
    state.targetLanguage = languageSelect.value;
    syncBridgeState();
});

listenOrbButton.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || state.isActivated) {
        return;
    }
    listenOrbButton.setPointerCapture(event.pointerId);
    state.activationTimer = setTimeout(() => {
        state.activationTimer = null;
        activateOrb();
        playChime();
    }, 3000);
});

function clearListenActivation(event) {
    if (state.activationTimer) {
        clearTimeout(state.activationTimer);
        state.activationTimer = null;
    }
    try {
        listenOrbButton.releasePointerCapture(event.pointerId);
    } catch (err) {
        // Ignore pointer capture errors.
    }
}

listenOrbButton.addEventListener('pointerup', clearListenActivation);
listenOrbButton.addEventListener('pointercancel', clearListenActivation);
listenOrbButton.addEventListener('pointerleave', clearListenActivation);

updateAudioRouting();
setOrbVisuals(0);
updateTranslateOrb();
