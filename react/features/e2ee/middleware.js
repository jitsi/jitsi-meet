// @flow

import { APP_WILL_MOUNT, APP_WILL_UNMOUNT } from '../base/app';
import { getCurrentConference } from '../base/conference';
import {
    getLocalParticipant, getParticipantById,
    getParticipantCount,
    PARTICIPANT_JOINED,
    PARTICIPANT_LEFT,
    PARTICIPANT_UPDATED,
    participantUpdated
} from '../base/participants';
import { MiddlewareRegistry, StateListenerRegistry } from '../base/redux';
import { playSound, registerSound, unregisterSound } from '../base/sounds';

import {
    SET_EVERYONE_ENABLED,
    SET_EVERYONE_SUPPORTS,
    TOGGLE_E2EE
} from './actionTypes';
import { toggleE2EE } from './actions';
import { E2EE_OFF_SOUND_ID, E2EE_ON_SOUND_ID } from './constants';
import logger from './logger';
import { E2EE_OFF_SOUND_FILE, E2EE_ON_SOUND_FILE } from './sounds';

/**
 * Middleware that captures actions related to E2EE.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(({ dispatch, getState }) => next => action => {
    switch (action.type) {
    case APP_WILL_MOUNT:
        dispatch(registerSound(
            E2EE_OFF_SOUND_ID,
            E2EE_OFF_SOUND_FILE));

        dispatch(registerSound(
            E2EE_ON_SOUND_ID,
            E2EE_ON_SOUND_FILE));
        break;

    case APP_WILL_UNMOUNT:
        dispatch(unregisterSound(E2EE_OFF_SOUND_ID));
        dispatch(unregisterSound(E2EE_ON_SOUND_ID));
        break;

    case PARTICIPANT_UPDATED: {
        const { id, e2eeEnabled, e2eeSupported } = action.participant;
        const oldParticipant = getParticipantById(getState(), id);
        const result = next(action);

        if (e2eeEnabled !== oldParticipant.e2eeEnabled
            || e2eeSupported !== oldParticipant.e2eeSupported) {

            const participantsState = getState()['features/base/participants'];
            let newEveryoneSupportsE2EE = true;
            let newEveryoneEnabledE2EE = true;

            participantsState.remote.values().forEach(p => {
                if (!p.e2eeEnabled) {
                    newEveryoneEnabledE2EE = false;
                }

                if (!p.e2eeSupported) {
                    newEveryoneSupportsE2EE = false;
                }
            });

            if (!participantsState.local.e2eeEnabled) {
                newEveryoneEnabledE2EE = false;
            }

            dispatch({
                type: SET_EVERYONE_ENABLED,
                everyoneEnabledE2EE: newEveryoneEnabledE2EE
            });
            dispatch({
                type: SET_EVERYONE_SUPPORTS,
                everyoneSupportsE2EE: newEveryoneSupportsE2EE
            });
        }

        return result;
    }
    case PARTICIPANT_JOINED: {
        const result = next(action);
        const { e2eeEnabled, e2eeSupported, local } = action.participant;
        const { everyoneEnabledE2EE } = getState()['features/e2ee'];
        const participantCount = getParticipantCount(getState());

        // the initial values
        if (participantCount === 1) {
            dispatch({
                type: SET_EVERYONE_ENABLED,
                everyoneEnabledE2EE: e2eeEnabled
            });
            dispatch({
                type: SET_EVERYONE_SUPPORTS,
                everyoneSupportsE2EE: e2eeSupported
            });
        }

        // if all had it enabled and this one disabled it, change value in store
        // otherwise there is no change in the value we store
        if (everyoneEnabledE2EE && !e2eeEnabled) {
            dispatch({
                type: SET_EVERYONE_ENABLED,
                everyoneEnabledE2EE: false
            });
        }

        if (local) {
            return result;
        }

        const { everyoneSupportsE2EE } = getState()['features/e2ee'];

        // if all supported it and this one does not, change value in store
        // otherwise there is no change in the value we store
        if (everyoneSupportsE2EE && !e2eeSupported) {
            dispatch({
                type: SET_EVERYONE_SUPPORTS,
                everyoneSupportsE2EE: false
            });
        }

        return result;
    }

    case PARTICIPANT_LEFT: {
        const result = next(action);
        const { e2eeEnabled, e2eeSupported } = action.participant;

        const { everyoneEnabledE2EE } = getState()['features/e2ee'];

        const participantsState = getState()['features/base/participants'];
        let latestEveryoneSupportsE2EE;

        // if it was not enabled by everyone, and the participant leaving had it disabled
        // let's check is it enabled for all that stay
        if (!everyoneEnabledE2EE && !e2eeEnabled) {
            let latestEveryoneEnabledE2EE = true;

            latestEveryoneSupportsE2EE = true;
            participantsState.remote.values().forEach(p => {
                if (!p.e2eeEnabled) {
                    latestEveryoneEnabledE2EE = false;
                }

                if (!p.e2eeSupported) {
                    latestEveryoneSupportsE2EE = false;
                }
            });

            if (!participantsState.local.e2eeEnabled) {
                latestEveryoneEnabledE2EE = false;
            }

            if (latestEveryoneEnabledE2EE) {
                dispatch({
                    type: SET_EVERYONE_ENABLED,
                    everyoneEnabledE2EE: true
                });
            }
        }
        const { everyoneSupportsE2EE } = getState()['features/e2ee'];

        // if it was not supported by everyone, and the participant leaving had it not supported
        // let's check is it supported by all that stay behind
        if (!everyoneSupportsE2EE && !e2eeSupported) {
            // we haven't checked the participants, let'/'s do it now
            if (latestEveryoneSupportsE2EE === undefined) {
                latestEveryoneSupportsE2EE = true;
                participantsState.remote.values().forEach(p => {
                    if (!p.e2eeSupported) {
                        latestEveryoneSupportsE2EE = false;
                    }
                });
            }

            if (latestEveryoneSupportsE2EE) {
                dispatch({
                    type: SET_EVERYONE_SUPPORTS,
                    everyoneSupportsE2EE: true
                });
            }
        }

        return result;
    }

    case TOGGLE_E2EE: {
        const conference = getCurrentConference(getState);

        if (conference && conference.isE2EEEnabled() !== action.enabled) {
            logger.debug(`E2EE will be ${action.enabled ? 'enabled' : 'disabled'}`);
            conference.toggleE2EE(action.enabled);

            // Broadcast that we enabled / disabled E2EE.
            const participant = getLocalParticipant(getState);

            dispatch(participantUpdated({
                e2eeEnabled: action.enabled,
                id: participant.id,
                local: true
            }));

            const soundID = action.enabled ? E2EE_ON_SOUND_ID : E2EE_OFF_SOUND_ID;

            dispatch(playSound(soundID));
        }

        break;
    }
    }

    return next(action);
});

/**
 * Set up state change listener to perform maintenance tasks when the conference
 * is left or failed.
 */
StateListenerRegistry.register(
    state => getCurrentConference(state),
    (conference, { dispatch }, previousConference) => {
        if (previousConference) {
            dispatch(toggleE2EE(false));
        }
    });
