// @flow

import {
    VIDEO_QUALITY_LEVELS,
    setMaxReceiverVideoQuality
} from '../base/conference';
import {
    getPinnedParticipant,
    pinParticipant
} from '../base/participants';
import { StateListenerRegistry } from '../base/redux';
import { selectParticipant } from '../large-video';
import { shouldDisplayTileView } from './functions';

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
 * For auto-pin mode, listen for changes to the last known screen share
 * participant and automatically pin that participant.
 */
StateListenerRegistry.register(
    /* selector */ state => state['features/video-layout'].screenShares,
    /* listener */ (screenShares, store) =>
        _updateAutoPinnedParticipant(store));


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

    const latestScreenshareParticipantId = Array.from(screenShares).pop();

    if (latestScreenshareParticipantId) {
        dispatch(pinParticipant(latestScreenshareParticipantId));
    } else if (getPinnedParticipant(state['features/base/participants'])) {
        dispatch(pinParticipant(null));
    }
}
