type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'error';

export type OrbitBridgeState = {
    activated: boolean;
    activationPending: boolean;
    bridgeEnabled: boolean;
    connectionStatus: ConnectionStatus;
    currentSpeakerUserId: string | null;
    isSpeaker: boolean;
    isTalking: boolean;
    orbHue: number;
    orbScale: number;
    supernova: boolean;
    targetLanguage: string;
    ttsActive: boolean;
    errorMessage: string | null;
};

type OrbitBridgeConfig = {
    meetingId?: string;
    userId?: string;
    wsBaseUrl?: string;
    targetLanguage?: string;
    getAudioStream?: () => MediaStream | null;
    setVolume?: (participantId: string, volume: number) => void;
    getVolume?: (participantId: string) => number | undefined;
};

const listeners = new Set<() => void>();

let state: OrbitBridgeState = {
    activated: false,
    activationPending: false,
    bridgeEnabled: false,
    connectionStatus: 'idle',
    currentSpeakerUserId: null,
    isSpeaker: false,
    isTalking: false,
    orbHue: 210,
    orbScale: 1,
    supernova: false,
    targetLanguage: 'en',
    ttsActive: false,
    errorMessage: null
};

let config: OrbitBridgeConfig = {
    meetingId: 'default',
    userId: undefined,
    wsBaseUrl: undefined,
    targetLanguage: 'en'
};

let ws: WebSocket | null = null;
let activationTimer: ReturnType<typeof setTimeout> | null = null;
let supernovaTimer: ReturnType<typeof setTimeout> | null = null;
let visualizerContext: AudioContext | null = null;
let visualizerAnalyser: AnalyserNode | null = null;
let visualizerRaf: number | null = null;
let audioContext: AudioContext | null = null;
let pcmProcessor: ScriptProcessorNode | null = null;
let pcmGain: GainNode | null = null;
let pendingSpeak = false;
let pendingEnd = false;
let speechStartAt = 0;
let lastTalkAt = 0;
let mutedSpeakerId: string | null = null;
let mutedSpeakerVolume: number | undefined = undefined;
let ttsQueue: Array<{ audioBase64?: string; audioMimeType?: string; text?: string }> = [];
let ttsPlaying = false;

function emit() {
    listeners.forEach((listener) => listener());
}

function setState(next: Partial<OrbitBridgeState>) {
    state = { ...state, ...next };
    emit();
}

export function getOrbitBridgeState() {
    return state;
}

export function subscribeOrbitBridge(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

export function configureOrbitBridge(nextConfig: OrbitBridgeConfig) {
    const meetingIdChanged = nextConfig.meetingId && nextConfig.meetingId !== config.meetingId;
    const userIdChanged = nextConfig.userId && nextConfig.userId !== config.userId;
    config = {
        ...config,
        ...nextConfig
    };
    if (nextConfig.targetLanguage) {
        setState({ targetLanguage: nextConfig.targetLanguage });
    }
    if ((meetingIdChanged || userIdChanged) && ws) {
        ws.close();
    }
}

export function armActivation() {
    if (state.activated || state.activationPending) {
        return;
    }
    setState({ activationPending: true });
    activationTimer = setTimeout(() => {
        activationTimer = null;
        activateListening();
    }, 3000);
}

export function cancelActivation() {
    if (activationTimer) {
        clearTimeout(activationTimer);
        activationTimer = null;
    }
    if (state.activationPending) {
        setState({ activationPending: false });
    }
}

export function toggleBridge() {
    const nextEnabled = !state.bridgeEnabled;
    setState({ bridgeEnabled: nextEnabled });
    if (nextEnabled) {
        ensureConnection();
        syncBridgeState();
    } else {
        stopTtsQueue();
    }
    updateBridgeMute();
}

export function setTargetLanguage(language: string) {
    setState({ targetLanguage: language });
    syncBridgeState();
}

function activateListening() {
    if (state.activated) {
        return;
    }
    const stream = config.getAudioStream?.();
    if (!stream) {
        setState({
            activationPending: false,
            errorMessage: 'Microphone unavailable.'
        });
        return;
    }
    setState({
        activated: true,
        activationPending: false,
        errorMessage: null
    });
    playChime();
    ensureConnection();
    startVisualizer(stream);
}

function getWsUrl() {
    const fallbackProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const fallbackBase = `${fallbackProtocol}//${window.location.hostname}:8080`;
    const base = config.wsBaseUrl || fallbackBase;
    let url: URL;
    try {
        url = new URL(base);
    } catch (err) {
        url = new URL(fallbackBase);
    }
    if (url.protocol === 'http:') {
        url.protocol = 'ws:';
    }
    if (url.protocol === 'https:') {
        url.protocol = 'wss:';
    }
    const path = url.pathname.replace(/\/$/, '');
    url.pathname = path.endsWith('/ws') ? path : `${path}/ws`;
    if (config.meetingId) {
        url.searchParams.set('meetingId', config.meetingId);
    }
    if (config.userId) {
        url.searchParams.set('userId', config.userId);
    }
    return url.toString();
}

function ensureConnection() {
    if (ws || state.connectionStatus === 'connecting') {
        return;
    }
    const url = getWsUrl();
    setState({
        connectionStatus: 'connecting',
        errorMessage: null
    });
    ws = new WebSocket(url);
    ws.addEventListener('open', () => {
        setState({ connectionStatus: 'connected' });
        syncBridgeState();
    });
    ws.addEventListener('message', handleWsMessage);
    ws.addEventListener('error', () => {
        setState({
            connectionStatus: 'error',
            errorMessage: 'Bridge connection error.'
        });
    });
    ws.addEventListener('close', () => {
        ws = null;
        setState({
            connectionStatus: 'idle',
            currentSpeakerUserId: null,
            isSpeaker: false
        });
        stopSpeakerCapture();
        updateBridgeMute(true);
    });
}

function handleWsMessage(event: MessageEvent) {
    let message: any;
    try {
        message = JSON.parse(event.data);
    } catch (err) {
        return;
    }
    switch (message.type) {
        case 'WELCOME': {
            const speakerId = message.currentSpeakerUserId || null;
            const isSpeaker = Boolean(speakerId && speakerId === config.userId);
            setState({
                currentSpeakerUserId: speakerId,
                isSpeaker
            });
            if (isSpeaker) {
                startSpeakerCapture();
            }
            updateBridgeMute();
            break;
        }
        case 'SPEAKER_UPDATE': {
            const speakerId = message.currentSpeakerUserId || null;
            const isSpeaker = Boolean(speakerId && speakerId === config.userId);
            setState({
                currentSpeakerUserId: speakerId,
                isSpeaker
            });
            pendingSpeak = false;
            pendingEnd = false;
            speechStartAt = 0;
            if (isSpeaker) {
                startSpeakerCapture();
                lastTalkAt = performance.now();
            } else {
                stopSpeakerCapture();
            }
            updateBridgeMute();
            if (isSpeaker) {
                stopTtsQueue();
            }
            break;
        }
        case 'SPEAK_DENY': {
            pendingSpeak = false;
            speechStartAt = 0;
            break;
        }
        case 'TRANSCRIPT': {
            break;
        }
        case 'TTS_AUDIO': {
            enqueueTts(message.translatedText, message.audioMimeType, message.audioChunks);
            break;
        }
        case 'BRIDGE_UPDATED': {
            break;
        }
        default:
            break;
    }
}

function syncBridgeState() {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        return;
    }
    ws.send(JSON.stringify({
        type: 'SET_BRIDGE',
        meetingId: config.meetingId,
        bridgeEnabled: state.bridgeEnabled,
        targetLanguage: state.targetLanguage
    }));
}

function sendSpeakStart() {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        return;
    }
    ws.send(JSON.stringify({
        type: 'SPEAK_START',
        meetingId: config.meetingId
    }));
}

function sendSpeakEnd() {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        return;
    }
    ws.send(JSON.stringify({
        type: 'SPEAK_END',
        meetingId: config.meetingId
    }));
}

function updateBridgeMute(forceReset = false) {
    if (!config.setVolume || !config.getVolume) {
        return;
    }
    const shouldMute = Boolean(
        !forceReset
        && state.bridgeEnabled
        && state.currentSpeakerUserId
        && state.currentSpeakerUserId !== config.userId
    );
    if (mutedSpeakerId && (!shouldMute || mutedSpeakerId !== state.currentSpeakerUserId)) {
        const restoreVolume = mutedSpeakerVolume ?? 1;
        config.setVolume(mutedSpeakerId, restoreVolume);
        mutedSpeakerId = null;
        mutedSpeakerVolume = undefined;
    }
    if (shouldMute && state.currentSpeakerUserId) {
        if (mutedSpeakerId !== state.currentSpeakerUserId) {
            mutedSpeakerId = state.currentSpeakerUserId;
            mutedSpeakerVolume = config.getVolume(mutedSpeakerId);
            config.setVolume(mutedSpeakerId, 0);
        }
    }
}

function downsampleBuffer(buffer: Float32Array, inputRate: number, outputRate: number) {
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

function floatTo16BitPCM(floatBuffer: Float32Array) {
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

function base64FromBytes(bytes: Uint8Array) {
    let binary = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.subarray(i, i + chunkSize);
        binary += String.fromCharCode(...chunk);
    }
    return btoa(binary);
}

function startPcmCapture(stream: MediaStream) {
    if (audioContext || !stream) {
        return;
    }
    const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextCtor) {
        return;
    }
    const context = new AudioContextCtor();
    context.resume().catch(() => undefined);
    const source = context.createMediaStreamSource(stream);
    const processor = context.createScriptProcessor(4096, 1, 1);
    const gain = context.createGain();
    gain.gain.value = 0;
    processor.onaudioprocess = (event) => {
        if (!ws || ws.readyState !== WebSocket.OPEN) {
            return;
        }
        const input = event.inputBuffer.getChannelData(0);
        const downsampled = downsampleBuffer(input, context.sampleRate, 16000);
        const pcm = floatTo16BitPCM(downsampled);
        const audioBase64 = base64FromBytes(pcm);
        ws.send(JSON.stringify({
            type: 'PCM_CHUNK',
            meetingId: config.meetingId,
            audioMimeType: 'audio/pcm;rate=16000',
            audioBase64
        }));
    };
    source.connect(processor);
    processor.connect(gain);
    gain.connect(context.destination);
    audioContext = context;
    pcmProcessor = processor;
    pcmGain = gain;
}

function stopPcmCapture() {
    if (pcmProcessor) {
        pcmProcessor.disconnect();
        pcmProcessor.onaudioprocess = null;
    }
    if (pcmGain) {
        pcmGain.disconnect();
    }
    if (audioContext) {
        audioContext.close().catch(() => undefined);
    }
    audioContext = null;
    pcmProcessor = null;
    pcmGain = null;
}

function startSpeakerCapture() {
    const stream = config.getAudioStream?.();
    if (!stream) {
        return;
    }
    startPcmCapture(stream);
}

function stopSpeakerCapture() {
    stopPcmCapture();
}

function setOrbVisuals(level: number) {
    const clamped = Math.min(1, Math.max(0, level));
    const hue = 210 + clamped * 90;
    const scale = 1 + clamped * 0.18;
    if (Math.abs(hue - state.orbHue) > 1 || Math.abs(scale - state.orbScale) > 0.01) {
        setState({
            orbHue: hue,
            orbScale: scale
        });
    }
}

function triggerSupernova() {
    if (supernovaTimer) {
        clearTimeout(supernovaTimer);
    }
    setState({ supernova: true });
    supernovaTimer = setTimeout(() => {
        setState({ supernova: false });
        supernovaTimer = null;
    }, 900);
}

function startVisualizer(stream: MediaStream) {
    if (visualizerContext || !stream) {
        return;
    }
    const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextCtor) {
        return;
    }
    const context = new AudioContextCtor();
    const analyser = context.createAnalyser();
    analyser.fftSize = 1024;
    const source = context.createMediaStreamSource(stream);
    source.connect(analyser);
    context.resume().catch(() => undefined);
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
        const now = performance.now();
        setOrbVisuals(level);
        const talking = level > 0.08;
        if (talking) {
            lastTalkAt = now;
            if (!state.isTalking) {
                setState({ isTalking: true });
            }
        } else if (state.isTalking && now - lastTalkAt > 500) {
            setState({ isTalking: false });
        }
        if (state.activated && ws && ws.readyState === WebSocket.OPEN) {
            const startThreshold = 0.12;
            const endThreshold = 0.06;
            const loudEnough = level > startThreshold;
            const quietEnough = level < endThreshold;
            if (!state.isSpeaker && !pendingSpeak && !state.currentSpeakerUserId) {
                if (loudEnough) {
                    if (!speechStartAt) {
                        speechStartAt = now;
                    } else if (now - speechStartAt > 180) {
                        pendingSpeak = true;
                        speechStartAt = 0;
                        sendSpeakStart();
                    }
                } else {
                    speechStartAt = 0;
                }
            }
            if (state.isSpeaker && !pendingEnd) {
                if (loudEnough) {
                    lastTalkAt = now;
                }
                if (quietEnough && now - lastTalkAt > 650) {
                    pendingEnd = true;
                    sendSpeakEnd();
                    setState({ isTalking: false });
                    triggerSupernova();
                }
            }
        }
        visualizerRaf = requestAnimationFrame(update);
    };
    visualizerContext = context;
    visualizerAnalyser = analyser;
    visualizerRaf = requestAnimationFrame(update);
}

function stopVisualizer() {
    if (visualizerRaf) {
        cancelAnimationFrame(visualizerRaf);
        visualizerRaf = null;
    }
    if (visualizerAnalyser) {
        visualizerAnalyser.disconnect();
    }
    if (visualizerContext) {
        visualizerContext.close().catch(() => undefined);
    }
    visualizerContext = null;
    visualizerAnalyser = null;
}

function stopTtsQueue() {
    ttsQueue = [];
    ttsPlaying = false;
    setState({ ttsActive: false });
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }
}

function playNextTts() {
    if (ttsPlaying) {
        return;
    }
    const item = ttsQueue.shift();
    if (!item) {
        setState({ ttsActive: false });
        return;
    }
    ttsPlaying = true;
    setState({ ttsActive: true });
    if (item.audioBase64) {
        const audio = new Audio(`data:${item.audioMimeType};base64,${item.audioBase64}`);
        audio.onended = () => {
            ttsPlaying = false;
            playNextTts();
        };
        audio.onerror = () => {
            ttsPlaying = false;
            playNextTts();
        };
        audio.play().catch(() => {
            ttsPlaying = false;
            playNextTts();
        });
        return;
    }
    if (item.text && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(item.text);
        utterance.lang = state.targetLanguage;
        utterance.onend = () => {
            ttsPlaying = false;
            playNextTts();
        };
        window.speechSynthesis.speak(utterance);
        return;
    }
    ttsPlaying = false;
    playNextTts();
}

function enqueueTts(translatedText?: string, audioMimeType?: string, audioChunks?: string[]) {
    if (!state.bridgeEnabled || config.userId === state.currentSpeakerUserId) {
        return;
    }
    if (audioChunks && audioChunks.length) {
        audioChunks.forEach((chunk) => {
            ttsQueue.push({
                audioMimeType: audioMimeType || 'audio/mpeg',
                audioBase64: chunk
            });
        });
    } else if (translatedText) {
        ttsQueue.push({ text: translatedText });
    }
    playNextTts();
}

function playChime() {
    const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextCtor) {
        return;
    }
    const context = new AudioContextCtor();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = 640;
    gain.gain.value = 0.0001;
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    gain.gain.exponentialRampToValueAtTime(0.18, context.currentTime + 0.03);
    oscillator.frequency.exponentialRampToValueAtTime(880, context.currentTime + 0.18);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.28);
    oscillator.stop(context.currentTime + 0.3);
    oscillator.onended = () => context.close().catch(() => undefined);
}
