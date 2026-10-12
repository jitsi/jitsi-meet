import { atob } from 'abab';
import { NativeModules, Platform } from 'react-native';
import { RTCPeerConnection } from 'react-native-webrtc';

import { IEntropyRuntime, createNativeCrypto, installSecureEntropy } from './runtime';

const REQUIRED_METHODS = [
    'jitsiE2EEConferenceCreate', 'jitsiE2EEConferenceSetKey', 'jitsiE2EEConferenceRemoveParticipant',
    'jitsiE2EEConferenceClose', 'jitsiE2EEBindReceiver', 'jitsiE2EEVerifySender',
    'jitsiE2EERetirePeer', 'jitsiE2EERatchet'
];
let registered = false;

/**
 * Registers native bindings before lib-jitsi-meet creates a conference.
 * Registration only advertises capability; each conference must opt in.
 * Unsupported or stock SDK builds retain their ordinary startup behavior.
 *
 * @param {Object} JitsiMeetJS - The actual lib-jitsi-meet export.
 * @returns {boolean} Whether native managed E2EE was registered.
 */
export function registerNativeE2EERuntime(JitsiMeetJS: any): boolean {
    if (registered) {
        return true;
    }
    const runtime = globalThis as typeof globalThis & IEntropyRuntime & {
        HermesInternal?: unknown;
        JITSI_MEET_LITE_SDK?: boolean;
        Olm?: unknown;
    };
    const peerConnection = RTCPeerConnection as typeof RTCPeerConnection & {
        isNativeManagedE2EESupported?: () => boolean;
    };
    const nativeModule = NativeModules.WebRTCModule;
    let restoreEntropy: (() => void) | undefined;
    const previousOlm = runtime.Olm;

    try {
        if (![ 'ios', 'android' ].includes(Platform.OS) || !runtime.HermesInternal
                || runtime.JITSI_MEET_LITE_SDK
                || typeof JitsiMeetJS.registerNativeE2EE !== 'function'
                || !peerConnection.isNativeManagedE2EESupported?.()
                || REQUIRED_METHODS.some(name => typeof nativeModule?.[name] !== 'function')
                || typeof NativeModules.RNGetRandomValues?.getRandomBase64 !== 'function') {
            return false;
        }

        restoreEntropy = installSecureEntropy(runtime, NativeModules.RNGetRandomValues, atob);
        // A synchronous native call must actually work; remote debugging must not fall back.
        runtime.crypto!.getRandomValues!(new Uint8Array(1)).fill(0);

        // OlmAdapter owns initialization and the unchanged automatic key exchange.
        // The legacy distribution runs without WebAssembly or a Worker.
        const olm = require('@matrix-org/olm/olm_legacy.js');

        if (typeof olm.init !== 'function' || runtime.Olm !== olm) {
            throw new Error('Original Olm legacy runtime is unavailable');
        }
        JitsiMeetJS.registerNativeE2EE({
            platform: Platform.OS,
            RTCPeerConnection,
            nativeModule,
            crypto: createNativeCrypto(nativeModule)
        });
        registered = true;

        return true;
    } catch {
        // This is optional capability discovery, never permission to send plaintext.
        // lib-jitsi-meet rejects an explicit nativeManaged request without a provider.
        restoreEntropy?.();
        if (previousOlm === undefined) {
            delete runtime.Olm;
        } else {
            runtime.Olm = previousOlm;
        }

        return false;
    }
}
