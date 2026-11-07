import type { Participant } from '../../helpers/Participant';

export interface IAudioTrackInspection {
    dominantFreq: number;
    hasAudioEnergy: boolean;
    maxEnergy: number;
    sampleRate: number;
    simulatedDeviceId?: string;
    trackId: string;
}

/**
 * Reads the noise suppression slice of the Redux store.
 *
 * @param {Participant} p - The participant whose state is to be inspected.
 * @returns {Promise<{ enabled: boolean }>}
 */
export async function getNoiseSuppressionState(p: Participant): Promise<{ enabled: boolean; }> {
    return p.driver.execute(() => APP.store.getState()['features/noise-suppression']);
}

/**
 * Checks whether the current local Jitsi audio track has an active NoiseSuppressionEffect applied.
 *
 * @param {Participant} p - The participant whose track is to be checked.
 * @returns {Promise<boolean>}
 */
export async function isNoiseSuppressionEffectApplied(p: Participant): Promise<boolean> {
    const info = await p.driver.execute(() => {
        const state = APP.store.getState();
        const tracks = state['features/base/tracks'] || [];
        const localAudio = tracks.find((t: any) => t.local && t.mediaType === 'audio');
        const streamEffect = (localAudio?.jitsiTrack as any)?._streamEffect;

        return {
            constructorName: streamEffect?.constructor?.name,
            hasEffect: Boolean(streamEffect),
            hasStartEffect: typeof streamEffect?.startEffect === 'function',
            hasStopEffect: typeof streamEffect?.stopEffect === 'function'
        };
    });

    return Boolean(info.hasEffect && (info.hasStartEffect || info.constructorName === 'NoiseSuppressionEffect'));
}

/**
 * Checks whether the RNNoise AudioWorkletNode is properly connected in the audio graph.
 *
 * @param {Participant} p - The participant to inspect.
 * @returns {Promise<boolean>}
 */
export async function isNoiseSuppressionWorkletActive(p: Participant): Promise<boolean> {
    return p.driver.execute(() => {
        const state = APP.store.getState();
        const tracks = state['features/base/tracks'] || [];
        const localAudio = tracks.find((t: any) => t.local && t.mediaType === 'audio');
        const streamEffect = (localAudio?.jitsiTrack as any)?._streamEffect;
        const worklet = streamEffect?._noiseSuppressorNode;

        return Boolean(
            streamEffect
            && worklet
            && worklet.numberOfInputs === 1
            && worklet.numberOfOutputs === 1
            && streamEffect._audioSource
            && streamEffect._audioDestination
        );
    });
}

/**
 * Waits until the RNNoise AudioWorkletNode is asynchronously compiled and connected.
 *
 * @param {Participant} p - The participant to wait on.
 * @param {number} timeout - Maximum timeout in ms.
 * @returns {Promise<void>}
 */
export async function waitForNoiseSuppressionWorklet(p: Participant, timeout = 15000): Promise<void> {
    await p.driver.waitUntil(
        async () => isNoiseSuppressionWorkletActive(p),
        {
            timeout,
            timeoutMsg: `Noise suppression worklet did not activate within ${timeout}ms`
        }
    );
}

/**
 * Waits until noise suppression enabled flag matches expected value.
 *
 * @param {Participant} p - The participant to wait on.
 * @param {boolean} expected - Expected state.
 * @param {number} timeout - Maximum timeout in ms.
 * @returns {Promise<void>}
 */
export async function waitForNoiseSuppressionEnabled(p: Participant, expected: boolean, timeout = 30000): Promise<void> {
    await p.driver.waitUntil(
        async () => {
            const state = await getNoiseSuppressionState(p);

            return state.enabled === expected;
        },
        {
            timeout,
            timeoutMsg: `Noise suppression enabled state did not reach ${expected} within ${timeout}ms`
        }
    );
}

/**
 * Gets the current local audio track deviceId.
 *
 * @param {Participant} p - The participant to inspect.
 * @returns {Promise<string | undefined>}
 */
export async function getLocalAudioDeviceId(p: Participant): Promise<string | undefined> {
    return p.driver.execute(() => {
        const state = APP.store.getState();
        const tracks = state['features/base/tracks'] || [];
        const localAudio = tracks.find((t: any) => t.local && t.mediaType === 'audio');
        const simulatedId = (localAudio?.jitsiTrack?.track as any)?._simulatedDeviceId;
        const jitsiId = localAudio?.jitsiTrack?.getDeviceId();
        const userSelectedId = state['features/base/settings']?.userSelectedMicDeviceId;

        return simulatedId || (jitsiId && jitsiId !== '' ? jitsiId : userSelectedId);
    });
}

/**
 * Waits until the local audio track deviceId matches expected condition.
 *
 * @param {Participant} p - The participant to wait on.
 * @param {Function} predicate - Predicate to test device ID.
 * @param {string} msg - Timeout failure message.
 * @param {number} timeout - Maximum timeout in ms.
 * @returns {Promise<void>}
 */
export async function waitForAudioDeviceId(
        p: Participant,
        predicate: (id: string | undefined) => boolean,
        msg: string,
        timeout = 15000
): Promise<void> {
    await p.driver.waitUntil(
        async () => {
            const currentId = await getLocalAudioDeviceId(p);

            return predicate(currentId);
        },
        {
            timeout,
            timeoutMsg: msg
        }
    );
}

/**
 * Gets the native channelCount reported by the current local audio track settings.
 *
 * @param {Participant} p - The participant to inspect.
 * @returns {Promise<number | undefined>}
 */
export async function getLocalAudioChannelCount(p: Participant): Promise<number | undefined> {
    return p.driver.execute(() => {
        const state = APP.store.getState();
        const tracks = state['features/base/tracks'] || [];
        const localAudio = tracks.find((t: any) => t.local && t.mediaType === 'audio');

        return localAudio?.jitsiTrack?.track?.getSettings()?.channelCount;
    });
}

/**
 * Inspects the current local audio track, analyzing audio energy and dominant frequency
 * flowing through the track (and through RNNoise if enabled).
 *
 * @param {Participant} p - The participant whose audio track is to be inspected.
 * @returns {Promise<IAudioTrackInspection | null>}
 */
export async function inspectLocalAudioTrack(p: Participant): Promise<IAudioTrackInspection | null> {
    return p.driver.execute(async () => {
        const state = APP.store.getState();
        const tracks = state['features/base/tracks'] || [];
        const localAudio = tracks.find((t: any) => t.local && t.mediaType === 'audio');
        const jitsiTrack = localAudio?.jitsiTrack;
        const track = jitsiTrack?.track;

        if (!track) {
            return null;
        }

        const streamEffect = (jitsiTrack as any)?._streamEffect;
        const originalTrack = streamEffect?._originalMediaTrack || track;
        const simulatedDeviceId = (originalTrack as any)?._simulatedDeviceId;

        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioCtx();

        if (audioCtx.state === 'suspended') {
            await audioCtx.resume();
        }

        const sourceNode = audioCtx.createMediaStreamSource(new MediaStream([ track ]));
        const analyser = audioCtx.createAnalyser();

        analyser.fftSize = 1024;
        sourceNode.connect(analyser);

        const binCount = analyser.frequencyBinCount;
        const data = new Uint8Array(binCount);

        // Wait for Web Audio graph and FFT buffer to stabilize
        await new Promise(r => setTimeout(r, 200));

        let maxVal = 0;
        let maxBin = -1;

        for (let i = 0; i < 8; i++) {
            analyser.getByteFrequencyData(data);
            for (let b = 0; b < binCount; b++) {
                if (data[b] > maxVal) {
                    maxVal = data[b];
                    maxBin = b;
                }
            }
            if (maxVal > 100) {
                break;
            }
            await new Promise(r => setTimeout(r, 50));
        }

        const sampleRate = audioCtx.sampleRate;
        const dominantFreq = maxBin >= 0 ? Math.round((maxBin * sampleRate) / analyser.fftSize) : 0;

        sourceNode.disconnect();
        await audioCtx.close();

        return {
            dominantFreq,
            hasAudioEnergy: maxVal > 0,
            maxEnergy: maxVal,
            sampleRate,
            simulatedDeviceId,
            trackId: track.id
        };
    });
}

/**
 * Sets up simulated audio input devices with genuine Web Audio mono streams.
 * Instead of overriding or mocking track.getSettings(), this uses real browser
 * AudioContext MediaStreamDestinations with explicit channelCount = 1, ensuring
 * that the media stream tracks delivered to RNNoise are natively mono.
 *
 * @param {Participant} p - The participant to configure.
 * @returns {Promise<void>}
 */
export async function setupSimulatedAudioDevices(p: Participant): Promise<void> {
    await p.driver.execute(async () => {
        if ((window as any).__simulatedAudioSetup) {
            return;
        }
        (window as any).__simulatedAudioSetup = true;
        (window as any).__simulatedAudioContexts = [];

        /**
         * Creates a genuine mono MediaStream using the browser's Web Audio API.
         */
        const createGenuineMonoStream = (deviceId: string, frequency = 440): MediaStream => {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            const audioCtx = new AudioCtx();

            (window as any).__simulatedAudioContexts.push(audioCtx);

            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }

            const osc = audioCtx.createOscillator();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);

            const dest = audioCtx.createMediaStreamDestination();

            dest.channelCount = 1;
            dest.channelCountMode = 'explicit';
            dest.channelInterpretation = 'speakers';

            osc.connect(dest);
            osc.start();

            const stream = dest.stream;
            const track = stream.getAudioTracks()[0];

            (track as any)._simulatedDeviceId = deviceId;

            return stream;
        };

        const originalEnumerate = navigator.mediaDevices.enumerateDevices.bind(navigator.mediaDevices);
        const originalGUM = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);

        navigator.mediaDevices.enumerateDevices = async () => {
            const devices = await originalEnumerate();
            const hasSecondary = devices.some(d => d.deviceId === 'simulated-mic-secondary');

            if (!hasSecondary) {
                return [
                    ...devices,
                    {
                        deviceId: 'simulated-mic-secondary',
                        groupId: 'simulated-group-secondary',
                        kind: 'audioinput',
                        label: 'Simulated Secondary Microphone'
                    } as MediaDeviceInfo
                ];
            }

            return devices;
        };

        navigator.mediaDevices.getUserMedia = async (constraints?: MediaStreamConstraints) => {
            const audioConstraint = constraints?.audio;

            if (audioConstraint) {
                const requestedDeviceId = typeof audioConstraint === 'object' && audioConstraint !== null
                    ? (typeof (audioConstraint as any).deviceId === 'string'
                        ? (audioConstraint as any).deviceId
                        : (audioConstraint as any).deviceId?.exact || (audioConstraint as any).deviceId?.ideal)
                    : undefined;

                if (requestedDeviceId === 'simulated-mic-secondary') {
                    return createGenuineMonoStream('simulated-mic-secondary', 880);
                }

                return createGenuineMonoStream(requestedDeviceId || 'default', 440);
            }

            return originalGUM(constraints);
        };

        // Switch to the genuine mono primary track immediately so the room starts with native mono audio
        await APP.conference.onAudioDeviceChanged('default');

        const JitsiMeetJS = (window as any).JitsiMeetJS;

        if (JitsiMeetJS?.mediaDevices?.enumerateDevices) {
            await new Promise<void>(resolve => {
                JitsiMeetJS.mediaDevices.enumerateDevices((devices: any) => {
                    APP.store.dispatch({
                        type: 'UPDATE_DEVICE_LIST',
                        devices
                    });
                    resolve();
                });
            });
        }
    });
}
