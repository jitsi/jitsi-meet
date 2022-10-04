import _ from 'lodash';
import { batch } from 'react-redux';

import { _RESET_BREAKOUT_ROOMS } from '../../breakout-rooms/actionTypes';
import { getCurrentConference } from '../conference/functions';
import { MEDIA_TYPE } from '../media/constants';
import { getScreenshareParticipantIds } from '../participants/functions';
import StateListenerRegistry from '../redux/StateListenerRegistry';

import { destroyLocalTracks, trackRemoved } from './actions.any';
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

/**
 * Set up state change listener to perform maintenance tasks when the conference
 * is left or failed, remove all tracks from the store.
 */
StateListenerRegistry.register(
    state => getCurrentConference(state),
    (conference, { dispatch, getState }, prevConference) => {
        const { authRequired, error } = getState()['features/base/conference'];

        // conference keep flipping while we are authenticating, skip clearing while we are in that process
        if (prevConference && !conference && !authRequired && !error) {

            // Clear all tracks.
            const remoteTracks = getState()['features/base/tracks'].filter(t => !t.local);

            batch(() => {
                dispatch(destroyLocalTracks());
                for (const track of remoteTracks) {
                    dispatch(trackRemoved(track.jitsiTrack));
                }
                dispatch({ type: _RESET_BREAKOUT_ROOMS });
            });
        }
    });
