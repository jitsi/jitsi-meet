import StateListenerRegistry from '../base/redux/StateListenerRegistry';
import { equals } from '../base/redux/functions';
import { isFollowMeActive } from '../follow-me/functions';

import { virtualScreenshareParticipantsUpdated } from './actions';
import { getAutoPinSetting, updateAutoPinnedParticipant } from './functions';

StateListenerRegistry.register(
    /* selector */ state => state['features/base/participants'].sortedRemoteVirtualScreenshareParticipants,
    /* listener */ (sortedRemoteVirtualScreenshareParticipants, store) => {
        const oldScreenSharesOrder = store.getState()['features/video-layout'].remoteScreenShares || [];
        const knownSharingParticipantIds = [ ...sortedRemoteVirtualScreenshareParticipants.keys() ];

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
            store.dispatch(virtualScreenshareParticipantsUpdated(newScreenSharesOrder));

            if (getAutoPinSetting() && !isFollowMeActive(store)) {
                updateAutoPinnedParticipant(oldScreenSharesOrder, store);
            }
        }
    });
