import { batch } from 'react-redux';

import { IStore } from '../app/types';
import { APP_WILL_MOUNT, APP_WILL_UNMOUNT } from '../base/app/actionTypes';
import { CONFERENCE_JOINED } from '../base/conference/actionTypes';
import { getCurrentConference } from '../base/conference/functions';
import { openDialog } from '../base/dialog/actions';
import { JitsiConferenceEvents } from '../base/lib-jitsi-meet';
import { PARTICIPANT_JOINED, PARTICIPANT_LEFT, PARTICIPANT_UPDATED } from '../base/participants/actionTypes';
import { participantUpdated } from '../base/participants/actions';
import {
    getLocalParticipant,
    getParticipantById,
    getParticipantCount,
    getRemoteParticipants,
    isScreenShareParticipant
} from '../base/participants/functions';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import StateListenerRegistry from '../base/redux/StateListenerRegistry';
import { playSound, registerSound, unregisterSound } from '../base/sounds/actions';

import { PARTICIPANT_VERIFIED, SET_MEDIA_ENCRYPTION_KEY, START_VERIFICATION, TOGGLE_E2EE } from './actionTypes';
import { setE2EEMaxMode, setEveryoneEnabledE2EE, setEveryoneSupportE2EE, toggleE2EE } from './actions';
import ParticipantVerificationDialog from './components/ParticipantVerificationDialog';
import { E2EE_OFF_SOUND_ID, E2EE_ON_SOUND_ID, MAX_MODE } from './constants';
import { isMaxModeReached, isMaxModeThresholdReached } from './functions';
import logger from './logger';
import { E2EE_OFF_SOUND_FILE, E2EE_ON_SOUND_FILE } from './sounds';


/**
 * Middleware that captures actions related to E2EE.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(({ dispatch, getState }) => next => action => {
    const conference = getCurrentConference(getState);

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

    case CONFERENCE_JOINED:
        _updateMaxMode(dispatch, getState);

        break;

    case PARTICIPANT_UPDATED: {
        const { id, e2eeEnabled, e2eeSupported } = action.participant;
        const oldParticipant = getParticipantById(getState(), id);
        const result = next(action);

        if (e2eeEnabled !== oldParticipant?.e2eeEnabled
            || e2eeSupported !== oldParticipant?.e2eeSupported) {
            const state = getState();
            let newEveryoneSupportE2EE = true;
            let newEveryoneEnabledE2EE = true;

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            for (const [ key, p ] of getRemoteParticipants(state)) {
                if (!p.e2eeEnabled) {
                    newEveryoneEnabledE2EE = false;
                }

                if (!p.e2eeSupported) {
                    newEveryoneSupportE2EE = false;
                }

                if (!newEveryoneEnabledE2EE && !newEveryoneSupportE2EE) {
                    break;
                }
            }

            if (!getLocalParticipant(state)?.e2eeEnabled) {
                newEveryoneEnabledE2EE = false;
            }

            batch(() => {
                dispatch(setEveryoneEnabledE2EE(newEveryoneEnabledE2EE));
                dispatch(setEveryoneSupportE2EE(newEveryoneSupportE2EE));
            });
        }

        return result;
    }
    case PARTICIPANT_JOINED: {
        const result = next(action);
        const { e2eeEnabled, e2eeSupported, local } = action.participant;
        const { everyoneEnabledE2EE } = getState()['features/e2ee'];
        const participantCount = getParticipantCount(getState);

        if (isScreenShareParticipant(action.participant)) {
            return result;
        }

        // the initial values
        if (participantCount === 1) {
            batch(() => {
                dispatch(setEveryoneEnabledE2EE(e2eeEnabled));
                dispatch(setEveryoneSupportE2EE(e2eeSupported));
            });
        }

        // if all had it enabled and this one disabled it, change value in store
        // otherwise there is no change in the value we store
        if (everyoneEnabledE2EE && !e2eeEnabled) {
            dispatch(setEveryoneEnabledE2EE(false));
        }

        if (local) {
            return result;
        }

        const { everyoneSupportE2EE } = getState()['features/e2ee'];

        // if all supported it and this one does not, change value in store
        // otherwise there is no change in the value we store
        if (everyoneSupportE2EE && !e2eeSupported) {
            dispatch(setEveryoneSupportE2EE(false));
        }

        _updateMaxMode(dispatch, getState);

        return result;
    }

    case PARTICIPANT_LEFT: {
        const previosState = getState();
        const participant = getParticipantById(previosState, action.participant?.id);
        const result = next(action);
        const newState = getState();
        const { e2eeEnabled = false, e2eeSupported = false } = participant ?? {};

        if (isScreenShareParticipant(participant)) {
            return result;
        }

        const { everyoneEnabledE2EE, everyoneSupportE2EE } = newState['features/e2ee'];


        // if it was not enabled by everyone, and the participant leaving had it disabled, or if it was not supported
        // by everyone, and the participant leaving had it not supported let's check is it enabled for all that stay
        if ((!everyoneEnabledE2EE && !e2eeEnabled) || (!everyoneSupportE2EE && !e2eeSupported)) {
            let latestEveryoneEnabledE2EE = true;
            let latestEveryoneSupportE2EE = true;

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            for (const [ key, p ] of getRemoteParticipants(newState)) {
                if (!p.e2eeEnabled) {
                    latestEveryoneEnabledE2EE = false;
                }

                if (!p.e2eeSupported) {
                    latestEveryoneSupportE2EE = false;
                }

                if (!latestEveryoneEnabledE2EE && !latestEveryoneSupportE2EE) {
                    break;
                }
            }

            if (!getLocalParticipant(newState)?.e2eeEnabled) {
                latestEveryoneEnabledE2EE = false;
            }

            batch(() => {
                if (!everyoneEnabledE2EE && latestEveryoneEnabledE2EE) {
                    dispatch(setEveryoneEnabledE2EE(true));
                }

                if (!everyoneSupportE2EE && latestEveryoneSupportE2EE) {
                    dispatch(setEveryoneSupportE2EE(true));
                }
            });
        }

        _updateMaxMode(dispatch, getState);

        return result;
    }

    case TOGGLE_E2EE: {
        if (conference?.isE2EESupported() && conference.isE2EEEnabled() !== action.enabled) {
            logger.debug(`E2EE will be ${action.enabled ? 'enabled' : 'disabled'}`);
            conference.toggleE2EE(action.enabled);

            // Broadcast that we enabled / disabled E2EE.
            const participant = getLocalParticipant(getState);

            dispatch(participantUpdated({
                e2eeEnabled: action.enabled,
                id: participant?.id ?? '',
                local: true
            }));

            const soundID = action.enabled ? E2EE_ON_SOUND_ID : E2EE_OFF_SOUND_ID;

            dispatch(playSound(soundID));
        }

        break;
    }

    case SET_MEDIA_ENCRYPTION_KEY: {
        if (conference?.isE2EESupported()) {
            const { exportedKey, index } = action.keyInfo;

            if (exportedKey) {
                window.crypto.subtle.importKey(
                    'raw',
                    new Uint8Array(exportedKey),
                    'AES-GCM',
                    false,
                    [ 'encrypt', 'decrypt' ])
                .then(
                    encryptionKey => {
                        conference.setMediaEncryptionKey({
                            encryptionKey,
                            index
                        });
                    })
                .catch(error => logger.error('SET_MEDIA_ENCRYPTION_KEY error', error));
            } else {
                conference.setMediaEncryptionKey({
                    encryptionKey: false,
                    index
                });
            }
        }

        break;
    }

    case PARTICIPANT_VERIFIED: {
        const { isVerified, pId } = action;

        conference?.markParticipantVerified(pId, isVerified);
        break;
    }

    case START_VERIFICATION: {
        conference?.startVerification(action.pId);
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

        if (conference) {
            conference.on(JitsiConferenceEvents.E2EE_VERIFICATION_AVAILABLE, (pId: string) => {
                dispatch(participantUpdated({
                    e2eeVerificationAvailable: true,
                    id: pId
                }));
            });

            conference.on(JitsiConferenceEvents.E2EE_VERIFICATION_READY, (pId: string, sas: object) => {
                dispatch(openDialog(ParticipantVerificationDialog, { pId,
                    sas }));
            });

            conference.on(JitsiConferenceEvents.E2EE_VERIFICATION_COMPLETED,
                (pId: string, success: boolean, message: string) => {
                    if (message) {
                        logger.warn('E2EE_VERIFICATION_COMPLETED warning', message);
                    }
                    dispatch(participantUpdated({
                        e2eeVerified: success,
                        id: pId
                    }));
                });
        }
    });

/**
 * Sets the maxMode based on the number of participants in the conference.
 *
 * @param { Dispatch<any>} dispatch - The redux dispatch function.
 * @param {Function|Object} getState - The {@code getState} function.
 * @private
 * @returns {void}
 */
function _updateMaxMode(dispatch: IStore['dispatch'], getState: IStore['getState']) {
    const state = getState();

    const { e2ee = {} } = state['features/base/config'];

    if (e2ee.externallyManagedKey) {
        return;
    }

    if (isMaxModeThresholdReached(state)) {
        dispatch(setE2EEMaxMode(MAX_MODE.THRESHOLD_EXCEEDED));
        dispatch(toggleE2EE(false));
    } else if (isMaxModeReached(state)) {
        dispatch(setE2EEMaxMode(MAX_MODE.ENABLED));
    } else {
        dispatch(setE2EEMaxMode(MAX_MODE.DISABLED));
    }
}
