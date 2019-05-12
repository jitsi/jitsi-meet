// @flow

import {
    VIDEO_QUALITY_LEVELS,
    setMaxReceiverVideoQuality
} from '../base/conference';
import {
    getPinnedParticipant,
    pinParticipant
} from '../base/participants';
import { StateListenerRegistry, equals } from '../base/redux';
import { selectParticipant } from '../large-video';
import { shouldDisplayTileView } from './functions';
import { setParticipantsWithScreenShare } from './actions';

declare var interfaceConfig: Object;

/**
 * StateListenerRegistry provides a reliable way of detecting changes to
 * preferred layout state and dispatching additional actions.
 */
StateListenerRegistry.register(
    /* selector */ state => shouldDisplayTileView(state),
    /* listener */ (displayTileView, store) => {
        const { dispatch } = store;

        dispatch(selectParticipant());

        if (!displayTileView) {
            dispatch(
                setMaxReceiverVideoQuality(VIDEO_QUALITY_LEVELS.HIGH));

            if (typeof interfaceConfig === 'object'
                && interfaceConfig.AUTO_PIN_LATEST_SCREEN_SHARE) {
                _updateAutoPinnedParticipant(store);
            }
        }
    }
);

/**
 * For auto-pin mode, listen for changes to the known media tracks and look
 * for updates to screen shares.
 */
StateListenerRegistry.register(
    /* selector */ state => state['features/base/tracks'],
    /* listener */ (tracks, store) => {
        if (typeof interfaceConfig !== 'object'
            || !interfaceConfig.AUTO_PIN_LATEST_SCREEN_SHARE) {
            return;
        }

        const oldScreenSharesOrder
            = store.getState()['features/video-layout'].screenShares || [];
        const knownSharingParticipantIds = tracks.reduce((acc, track) => {
            if (track.mediaType === 'video' && track.videoType === 'desktop') {
                acc.push(track.participantId);
            }

            return acc;
        }, []);

        // Filter out any participants which are no longer screen sharing
        // by looping through the known sharing participants and removing any
        // participant IDs which are no longer sharing.
        const newScreenSharesOrder = oldScreenSharesOrder.filter(
            participantId => knownSharingParticipantIds.includes(participantId));

        // Make sure all new sharing participant get added to the end of the
        // known screen shares.
        knownSharingParticipantIds.forEach(participantId => {
            if (!newScreenSharesOrder.includes(participantId)) {
                newScreenSharesOrder.push(participantId);
            }
        });

        if (!equals(oldScreenSharesOrder, newScreenSharesOrder)) {
            store.dispatch(
                setParticipantsWithScreenShare(newScreenSharesOrder));

            _updateAutoPinnedParticipant(store);
        }
    }
);

/**
 * Private helper to automatically pin the latest screen share stream or unpin
 * if there are no more screen share streams.
 *
 * @param {Store} store - The redux store.
 * @returns {void}
 */
function _updateAutoPinnedParticipant({ dispatch, getState }) {
    const state = getState();
    const screenShares = state['features/video-layout'].screenShares;

    if (!screenShares) {
        return;
    }

    const latestScreenshareParticipantId
        = screenShares[screenShares.length - 1];

    if (latestScreenshareParticipantId) {
        dispatch(pinParticipant(latestScreenshareParticipantId));
    } else if (getPinnedParticipant(state['features/base/participants'])) {
        dispatch(pinParticipant(null));
    }
}
