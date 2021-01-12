// @flow

import _ from 'lodash';

import { StateListenerRegistry } from '../../base/redux';

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
