import { IReduxState, IStore } from '../app/types';
import { browser } from '../base/lib-jitsi-meet';
import { MEDIA_TYPE } from '../base/media/constants';
import StateListenerRegistry from '../base/redux/StateListenerRegistry';
import { isLocalTrackMuted } from '../base/tracks/functions.any';
import { getElectronGlobalNS } from '../base/util/helpers';

import { hidePiP } from './actions';
import { requestPictureInPicture, shouldShowPiP, updateMediaSessionState } from './functions';
import logger from './logger';

/**
 * Listens to audio and video mute state changes when PiP is active
 * and updates the MediaSession API to reflect the current state in PiP controls.
 */
StateListenerRegistry.register(
    /* selector */ (state: IReduxState) => {
        // Skip if PiP is disabled or shouldn't be shown (e.g., on prejoin without showOnPrejoin).
        if (!shouldShowPiP(state)) {
            return null;
        }

        const isPiPActive = state['features/pip']?.isPiPActive;

        if (!isPiPActive) {
            return null;
        }

        return {
            audioMuted: isLocalTrackMuted(state['features/base/tracks'], MEDIA_TYPE.AUDIO),
            videoMuted: isLocalTrackMuted(state['features/base/tracks'], MEDIA_TYPE.VIDEO)
        };
    },
    /* listener */ (muteState: { audioMuted: boolean; videoMuted: boolean; } | null) => {
        if (muteState === null) {
            return;
        }

        updateMediaSessionState({
            cameraActive: !muteState.videoMuted,
            microphoneActive: !muteState.audioMuted
        });
    },
    {
        deepEquals: true
    }
);

if (browser.isElectron()) {
    StateListenerRegistry.register(
        /* selector */ shouldShowPiP,
        /* listener */ (_shouldShowPiP: boolean) => {
            const electronNS = getElectronGlobalNS();

            if (_shouldShowPiP) {
                // Expose requestPictureInPicture for Electron main process.
                if (!electronNS.requestPictureInPicture) {
                    logger.debug('Exposing requestPictureInPicture to Electron namespace');
                    electronNS.requestPictureInPicture = requestPictureInPicture;
                }
            } else if (typeof electronNS.requestPictureInPicture === 'function') {
                logger.debug('Removing requestPictureInPicture from Electron namespace (PiP disabled)');
                delete electronNS.requestPictureInPicture;
            }
        }
    );
} else {
    // Closes Picture-in-Picture as soon as it is no longer allowed, e.g. when the user turns browser PiP off in the
    // settings dialog while the PiP window is open, or when a config change disables it. Entering PiP is already
    // refused in that case; this takes care of a PiP that is open at that moment. Electron is left out: it has its
    // own always-on PiP flow, which the settings do not control.
    StateListenerRegistry.register(
        /* selector */ shouldShowPiP,
        /* listener */ (_shouldShowPiP: boolean, store: IStore) => {
            if (!_shouldShowPiP) {
                // hidePiP() exits only if PiP is open or a host window is being opened, so dispatching it whenever
                // the selector turns false, including at startup, is harmless.
                store.dispatch(hidePiP());
            }
        }
    );
}
