import {
    getLocalParticipant,
    getParticipantById,
    PIN_PARTICIPANT
} from '../participants';
import { MiddlewareRegistry } from '../redux';
import {
    TRACK_ADDED,
    TRACK_REMOVED
} from '../tracks';

import {
    _addLocalTracksToConference,
    _handleParticipantError,
    _removeLocalTracksFromConference
} from './functions';

/**
 * This middleware intercepts TRACK_ADDED and TRACK_REMOVED actions to sync
 * conference's local tracks with local tracks in state. Also captures
 * PIN_PARTICIPANT action to pin participant in conference.
 *
 * @param {Store} store - Redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case PIN_PARTICIPANT:
        pinParticipant(store, action.participant.id);
        break;

    case TRACK_ADDED:
    case TRACK_REMOVED: {
        const track = action.track;

        if (track && track.local) {
            return syncConferenceLocalTracksWithState(store, action)
                .then(() => next(action));
        }
        break;
    }
    }

    return next(action);
});

/**
 * Pins remote participant in conference, ignores local participant.
 *
 * @param {Store} store - Redux store.
 * @param {string|null} id - Participant id or null if no one is currently
 * pinned.
 * @returns {void}
 */
function pinParticipant(store, id) {
    const state = store.getState();
    const participants = state['features/base/participants'];
    const participantById = getParticipantById(participants, id);
    let pin;

    // The following condition prevents signaling to pin local participant. The
    // logic is:
    // - If we have an ID, we check if the participant identified by that ID is
    //   local.
    // - If we don't have an ID (i.e. no participant identified by an ID), we
    //   check for local participant. If she's currently pinned, then this
    //   action will unpin her and that's why we won't signal here too.
    if (participantById) {
        pin = !participantById.local;
    } else {
        const localParticipant = getLocalParticipant(participants);

        pin = !localParticipant || !localParticipant.pinned;
    }
    if (pin) {
        const conference = state['features/base/conference'].jitsiConference;

        try {
            conference.pinParticipant(id);
        } catch (err) {
            _handleParticipantError(err);
        }
    }
}

/**
 * Syncs local tracks from state with local tracks in JitsiConference instance.
 *
 * @param {Store} store - Redux store.
 * @param {Object} action - Action object.
 * @returns {Promise}
 */
function syncConferenceLocalTracksWithState(store, action) {
    const conferenceState = store.getState()['features/base/conference'];
    const conference = conferenceState.jitsiConference;
    const leavingConference = conferenceState.leavingJitsiConference;
    let promise;

    // XXX The conference in state might be already in 'leaving' state, that's
    // why we should not add/remove local tracks to such conference.
    if (conference && conference !== leavingConference) {
        const track = action.track.jitsiTrack;

        if (action.type === TRACK_ADDED) {
            promise = _addLocalTracksToConference(conference, [ track ]);
        } else {
            promise = _removeLocalTracksFromConference(conference, [ track ]);
        }
    }

    return promise || Promise.resolve();
}
