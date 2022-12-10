import _ from 'lodash';

import { MEDIA_TYPE } from '../media/constants';
import { getScreenshareParticipantIds } from '../participants/functions';
import StateListenerRegistry from '../redux/StateListenerRegistry';

import { isLocalTrackMuted } from './functions';

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
    /* selector */ state => isLocalTrackMuted(state['features/base/tracks'], MEDIA_TYPE.VIDEO),
    /* listener */ (muted, store, previousMuted) => {
        if (typeof APP !== 'object') {
            return;
        }

        if (muted !== previousMuted) {
            APP.API.notifyVideoMutedStatusChanged(muted);
        }
    }
);
