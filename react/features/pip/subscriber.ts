import { IReduxState, IStore } from '../app/types';
import { browser } from '../base/lib-jitsi-meet';
import { MEDIA_TYPE } from '../base/media/constants';
import StateListenerRegistry from '../base/redux/StateListenerRegistry';
import { isLocalTrackMuted } from '../base/tracks/functions.any';
import { getElectronGlobalNS } from '../base/util/helpers';

import { getPiPMode, requestPictureInPicture, shouldShowPiP, updateMediaSessionState } from './functions';
import logger from './logger';
import { PiPMode } from './types';

/**
 * Logs when config.pip.mode asks for an implementation this environment cannot
 * run. The request is then resolved to the platform default as if the mode
 * were unset, and the mode reported by the pipEntered event would otherwise be
 * the only trace of it.
 */
StateListenerRegistry.register(
    /* selector */ (state: IReduxState) => state['features/base/config'].pip?.mode,
    /* listener */ (configuredMode: PiPMode | undefined, store: IStore) => {
        if (!configuredMode) {
            return;
        }

        const mode = getPiPMode(store.getState());

        if (mode !== configuredMode) {
            logger.warn(`config.pip.mode '${configuredMode}' is not available in this environment, using '${mode}'`);
        }
    }
);

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
}

