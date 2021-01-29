// @flow

import debounce from 'lodash/debounce';

import { pinParticipant, getPinnedParticipant } from '../base/participants';
import { StateListenerRegistry, equals } from '../base/redux';
import { isFollowMeActive } from '../follow-me';
import { selectParticipant } from '../large-video/actions';

import { setRemoteParticipantsWithScreenShare } from './actions';

declare var APP: Object;
declare var interfaceConfig: Object;

/**
 * StateListenerRegistry provides a reliable way of detecting changes to
 * preferred layout state and dispatching additional actions.
 */
StateListenerRegistry.register(
    /* selector */ state => state['features/video-layout'].tileViewEnabled,
    /* listener */ (tileViewEnabled, store) => {
        const { dispatch } = store;

        dispatch(selectParticipant());
    }
);

/**
 * For auto-pin mode, listen for changes to the known media tracks and look
 * for updates to screen shares. The listener is debounced to avoid state
 * thrashing that might occur, especially when switching in or out of p2p.
 */
StateListenerRegistry.register(
    /* selector */ state => state['features/base/tracks'],
    /* listener */ debounce((tracks, store) => {
        if (!_getAutoPinSetting() || isFollowMeActive(store)) {
            return;
        }

        const oldScreenSharesOrder = store.getState()['features/video-layout'].remoteScreenShares || [];
        const knownSharingParticipantIds = tracks.reduce((acc, track) => {
            if (track.mediaType === 'video' && track.videoType === 'desktop') {
                const skipTrack = _getAutoPinSetting() === 'remote-only' && track.local;

                if (!skipTrack) {
                    acc.push(track.participantId);
                }
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
                setRemoteParticipantsWithScreenShare(newScreenSharesOrder));

            _updateAutoPinnedParticipant(store);
        }
    }, 100));

/**
 * A selector for retrieving the current automatic pinning setting.
 *
 * @private
 * @returns {string|undefined} The string "remote-only" is returned if only
 * remote screensharing should be automatically pinned, any other truthy value
 * means automatically pin all screenshares. Falsy means do not automatically
 * pin any screenshares.
 */
function _getAutoPinSetting() {
    return typeof interfaceConfig === 'object'
        ? interfaceConfig.AUTO_PIN_LATEST_SCREEN_SHARE
        : 'remote-only';
}

/**
 * Private helper to automatically pin the latest screen share stream or unpin
 * if there are no more screen share streams.
 *
 * @param {Store} store - The redux store.
 * @returns {void}
 */
function _updateAutoPinnedParticipant({ dispatch, getState }) {
    const state = getState();
    const remoteScreenShares = state['features/video-layout'].remoteScreenShares;

    if (!remoteScreenShares) {
        return;
    }

    const latestScreenshareParticipantId
        = remoteScreenShares[remoteScreenShares.length - 1];

    const pinned = getPinnedParticipant(getState);

    if (latestScreenshareParticipantId) {
        dispatch(pinParticipant(latestScreenshareParticipantId));
    } else if (pinned) {
        dispatch(pinParticipant(null));
    }
}
