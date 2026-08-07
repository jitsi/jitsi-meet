import { IReduxState } from '../app/types';
import { MEDIA_TYPE } from '../base/media/constants';
import StateListenerRegistry from '../base/redux/StateListenerRegistry';
import { isLocalTrackMuted } from '../base/tracks/functions.any';
import { getElectronGlobalNS } from '../base/util/helpers';

import { enterDocumentPiP } from './actions';
import { isDocumentPiPSupported } from './external-api.shared';
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

/**
 * Registers the MediaSession `enterpictureinpicture` action handler when PiP is
 * available and the browser supports the Document PiP API. Chromium calls this
 * handler automatically when the user switches tab, so the rich PiP window opens
 * with no extra gesture — exactly like Google Meet.
 */
StateListenerRegistry.register(
    /* selector */ (state: IReduxState) => shouldShowPiP(state) && isDocumentPiPSupported(),
    /* listener */ (enabled: boolean, store) => {
        // @ts-ignore - mediaSession is not fully typed in all environments.
        if (!('mediaSession' in navigator) || !navigator.mediaSession?.setActionHandler) {
            return;
        }

        try {
            // @ts-ignore - 'enterpictureinpicture' is a newer MediaSession action.
            navigator.mediaSession.setActionHandler('enterpictureinpicture', enabled
                ? () => store.dispatch(enterDocumentPiP())
                : null);
        } catch (error) {
            logger.warn('enterpictureinpicture MediaSession action not supported:', error);
        }
    }
);

