import { IReduxState } from '../app/types';
import { MEDIA_TYPE } from '../base/media/constants';
import StateListenerRegistry from '../base/redux/StateListenerRegistry';
import { isLocalTrackMuted } from '../base/tracks/functions.any';
import { getElectronGlobalNS } from '../base/util/helpers';

import { requestPictureInPicture, shouldShowPiP, updateMediaSessionState } from './functions';

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

StateListenerRegistry.register(
    /* selector */ shouldShowPiP,
    /* listener */ (_shouldShowPiP: boolean) => {
        const electronNS = getElectronGlobalNS();

        if (_shouldShowPiP) {
            // Expose requestPictureInPicture for Electron main process.
            if (!electronNS.requestPictureInPicture) {
                electronNS.requestPictureInPicture = requestPictureInPicture;
            }
        } else if (typeof electronNS.requestPictureInPicture === 'function') {
            delete electronNS.requestPictureInPicture;
        }
    }
);

