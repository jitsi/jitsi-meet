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
        store.dispatch(selectParticipant());

        if (!displayTileView) {
            store.dispatch(
                setMaxReceiverVideoQuality(VIDEO_QUALITY_LEVELS.HIGH));

            _updateAutoPinnedParticipant(store);
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
            && !interfaceConfig.AUTO_PIN_LATEST_SCREEN_SHARE) {
            return;
        }

        const oldSharingParticipantIds
            = store.getState()['features/video-layout'].screenShares || [];
        let newSharingParticipantIds = Array.from(oldSharingParticipantIds);
        const currentDesktopStreams = tracks.filter(track =>
            track.mediaType === 'video' && track.videoType === 'desktop');

        // Make sure all new desktop streams get added to the known screen
        // shares.
        currentDesktopStreams.forEach(({ participantId }) => {
            if (!newSharingParticipantIds.includes(participantId)) {
                newSharingParticipantIds.push(participantId);
            }
        });

        // Filter out any participants which are no longer screen sharing
        // by looping through the desktop streams and making sure only those
        // participant IDs with a desktop stream are included.
        newSharingParticipantIds = newSharingParticipantIds.filter(participantId =>
            currentDesktopStreams.find(stream => stream.participantId === participantId));

        if (!equals(oldSharingParticipantIds, newSharingParticipantIds)) {
            store.dispatch(
                setParticipantsWithScreenShare(newSharingParticipantIds));

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
    if (typeof interfaceConfig !== 'object'
            || !interfaceConfig.AUTO_PIN_LATEST_SCREEN_SHARE) {
        return;
    }

    const state = getState();
    const screenShares = state['features/video-layout'].screenShares;

    if (!screenShares) {
        return;
    }

    const latestScreenshareParticipantId = Array.from(screenShares).pop();

    if (latestScreenshareParticipantId) {
        dispatch(pinParticipant(latestScreenshareParticipantId));
    } else if (getPinnedParticipant(state['features/base/participants'])) {
        dispatch(pinParticipant(null));
    }
}
