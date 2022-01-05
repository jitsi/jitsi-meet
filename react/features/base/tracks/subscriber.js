// @flow

import _ from 'lodash';

import { StateListenerRegistry } from '../../base/redux';

import { isLocalCameraTrackMuted } from './functions';

declare var APP: Object;

/**
 * Notifies when the list of currently sharing participants changes.
 */
StateListenerRegistry.register(
    /* selector */ state =>
        state['features/base/tracks'].filter(tr => tr.videoType === 'desktop').map(t => t.participantId),
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
