import _ from 'lodash';

import { getScreenshareParticipantIds } from '../participants/functions';
import StateListenerRegistry from '../redux/StateListenerRegistry';

import { isLocalCameraTrackMuted } from './functions';

/**
 * Notifies when the list of currently sharing participants changes.
 */
StateListenerRegistry.register(
    /* selector */ state => getScreenshareParticipantIds(state),
    /* listener */ (participantIDs, store, previousParticipantIDs) => {
        if (typeof APP !== 'object') {
            return;
        }

        if (!_.isEqual(_.sortBy(participantIDs), _.sortBy(previousParticipantIDs))) {
            APP.API.notifySharingParticipantsChanged(participantIDs);
        }
    }
);


/**
 * Notifies when the local video mute state changes.
 */
StateListenerRegistry.register(
    /* selector */ state => isLocalCameraTrackMuted(state['features/base/tracks']),
    /* listener */ (muted, store, previousMuted) => {
        if (typeof APP !== 'object') {
            return;
        }

        if (muted !== previousMuted) {
            APP.API.notifyVideoMutedStatusChanged(muted);
        }
    }
);
