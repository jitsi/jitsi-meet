import { IStore } from '../app/types';
import { APP_WILL_MOUNT, APP_WILL_UNMOUNT } from '../base/app/actionTypes';
import { CONFERENCE_JOINED } from '../base/conference/actionTypes';
import { getCurrentConference } from '../base/conference/functions';
import { openDialog } from '../base/dialog/actions';
import { JitsiConferenceEvents } from '../base/lib-jitsi-meet';
import { PARTICIPANT_JOINED, PARTICIPANT_LEFT } from '../base/participants/actionTypes';
import { participantUpdated } from '../base/participants/actions';
import {
    getLocalParticipant,
    getParticipantById,
    isScreenShareParticipant
} from '../base/participants/functions';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import StateListenerRegistry from '../base/redux/StateListenerRegistry';
import { playSound } from '../base/sounds/actions';

import { PARTICIPANT_VERIFIED, SET_MEDIA_ENCRYPTION_KEY, START_VERIFICATION, TOGGLE_E2EE } from './actionTypes';
import { setE2EEMaxMode, toggleE2EE } from './actions';
import ParticipantVerificationDialog from './components/ParticipantVerificationDialog';
import { E2EE_OFF_SOUND_ID, E2EE_ON_SOUND_ID, MAX_MODE } from './constants';
import {
    isMaxModeReached,
    isMaxModeThresholdReached,
    registerE2eeAudioFiles,
    unregisterE2eeAudioFiles
} from './functions';
import logger from './logger';

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
        registerE2eeAudioFiles(dispatch);
        break;

    case APP_WILL_UNMOUNT:
        unregisterE2eeAudioFiles(dispatch);
        break;

    case CONFERENCE_JOINED:
        _updateMaxMode(dispatch, getState);

        break;

    case PARTICIPANT_JOINED: {
        const result = next(action);

        if (!isScreenShareParticipant(action.participant) && !action.participant.local) {
            _updateMaxMode(dispatch, getState);
        }

        return result;
    }

    case PARTICIPANT_LEFT: {
        const participant = getParticipantById(getState(), action.participant?.id);
        const result = next(action);

        if (!isScreenShareParticipant(participant)) {
            _updateMaxMode(dispatch, getState);
        }

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

    const { maxMode, enabled } = state['features/e2ee'];
    const isMaxModeThresholdReachedValue = isMaxModeThresholdReached(state);
    let newMaxMode: string;

    if (isMaxModeThresholdReachedValue) {
        newMaxMode = MAX_MODE.THRESHOLD_EXCEEDED;
    } else if (isMaxModeReached(state)) {
        newMaxMode = MAX_MODE.ENABLED;
    } else {
        newMaxMode = MAX_MODE.DISABLED;
    }

    if (maxMode !== newMaxMode) {
        dispatch(setE2EEMaxMode(newMaxMode));
    }

    if (isMaxModeThresholdReachedValue && !enabled) {
        dispatch(toggleE2EE(false));
    }
}
