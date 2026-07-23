import { IReduxState } from '../app/types';
import { MEDIA_TYPE } from '../base/media/constants';
import StateListenerRegistry from '../base/redux/StateListenerRegistry';
import { isLocalTrackMuted } from '../base/tracks/functions.any';
import { isEmbedded } from '../base/util/embedUtils';
import { getElectronGlobalNS } from '../base/util/helpers';

import {
    getEmbeddedDocumentPiPViewModel,
    isEmbeddedDocumentPiPAvailable
} from './embeddedDocumentPiP';
import {
    requestPictureInPicture,
    shouldShowPiP,
    updateMediaSessionState
} from './functions';
import logger from './logger';
import { EmbeddedDocumentPiPLifecycle } from './types';

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
    /* selector */ (state: IReduxState) => {
        const pipState = state['features/pip'];

        if (!isEmbeddedDocumentPiPAvailable(state)
                || pipState?.embeddedDocumentPiPLifecycle !== EmbeddedDocumentPiPLifecycle.ACTIVE
                || !pipState.embeddedDocumentPiPRendererReady) {
            return null;
        }

        return getEmbeddedDocumentPiPViewModel(state);
    },
    /* listener */ (_state: ReturnType<typeof getEmbeddedDocumentPiPViewModel> | null) => {
        if (_state) {
            APP.API.notifyDocumentPiPState(_state);
        }
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

StateListenerRegistry.register(
    /* selector */ (state: IReduxState) => isEmbedded()
        ? shouldShowPiP(state) && isEmbeddedDocumentPiPAvailable(state)
        : null,
    /* listener */ (available: boolean | null) => {
        if (available !== null) {
            APP.API.notifyDocumentPiPAvailability({ available });
        }
    }
);

