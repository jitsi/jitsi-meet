import { IStore } from '../app/types';
import { UPDATE_CONFERENCE_METADATA } from '../base/conference/actionTypes';
import { getCurrentConference } from '../base/conference/functions';
import {
    PARTICIPANT_LEFT,
    PARTICIPANT_ROLE_CHANGED
} from '../base/participants/actionTypes';
import { PARTICIPANT_ROLE } from '../base/participants/constants';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import StateListenerRegistry from '../base/redux/StateListenerRegistry';
import { updateRemoteParticipants } from '../filmstrip/functions';
import { selectParticipantInLargeVideo } from '../large-video/actions.any';
import { showErrorNotification, showWarningNotification } from '../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE } from '../notifications/constants';

import {
    DISABLE_TUTOR_MODE,
    ENABLE_TUTOR_MODE
} from './actionTypes';
import {
    clearTutorModeState,
    disableTutorMode,
    setTutorModeError,
    setTutorModeListenTargets,
    setTutorModePending
} from './actions';
import {
    getLocalParticipantId,
    getTutorId,
    isLocalParticipantModerator,
    isTutorModeCapabilityEnforced,
    isTutorModeEnabled
} from './functions.any';
import { TUTOR_MODE_METADATA_KEY, TUTOR_MODE_REQUEST_TIMEOUT } from './constants';
import logger from './logger';

/**
 * The timer that fails a tutor-mode request that the server never confirms.
 */
let requestTimeout: ReturnType<typeof setTimeout> | undefined;

/**
 * Clears the pending-request timeout, if any.
 *
 * @returns {void}
 */
function clearRequestTimeout() {
    if (requestTimeout !== undefined) {
        clearTimeout(requestTimeout);
        requestTimeout = undefined;
    }
}

/**
 * Writes the requested tutor-mode state to room metadata. The server validates
 * the write, derives the tutor identity and broadcasts the authoritative value.
 *
 * @param {IStore} store - The redux store.
 * @param {boolean} enabled - Whether to enable or disable the mode.
 * @returns {void}
 */
function _requestTutorModeChange(store: IStore, enabled: boolean) {
    const { dispatch, getState } = store;
    const state = getState();
    const conference = getCurrentConference(state);

    if (!conference) {
        dispatch(showErrorNotification({
            titleKey: 'tutorMode.errorNoConference'
        }, NOTIFICATION_TIMEOUT_TYPE.MEDIUM));

        return;
    }

    if (!isTutorModeCapabilityEnforced(state)) {
        dispatch(showErrorNotification({
            titleKey: 'tutorMode.errorServerUnsupported'
        }, NOTIFICATION_TIMEOUT_TYPE.STICKY));

        return;
    }

    if (!isLocalParticipantModerator(state)) {
        dispatch(showErrorNotification({
            titleKey: 'tutorMode.errorNotModerator'
        }, NOTIFICATION_TIMEOUT_TYPE.MEDIUM));

        return;
    }

    if (enabled && isTutorModeEnabled(state) && getTutorId(state) !== getLocalParticipantId(state)) {
        dispatch(showErrorNotification({
            titleKey: 'tutorMode.errorAnotherTutor'
        }, NOTIFICATION_TIMEOUT_TYPE.MEDIUM));

        return;
    }

    dispatch(setTutorModeError(null));
    dispatch(setTutorModePending(true));

    clearRequestTimeout();
    requestTimeout = setTimeout(() => {
        requestTimeout = undefined;

        if (store.getState()['features/tutor-mode'].pending) {
            dispatch(setTutorModePending(false));
            dispatch(setTutorModeError('tutorMode.errorTimeout'));
            dispatch(showErrorNotification({
                titleKey: 'tutorMode.errorTimeout'
            }, NOTIFICATION_TIMEOUT_TYPE.MEDIUM));
        }
    }, TUTOR_MODE_REQUEST_TIMEOUT);

    try {
        logger.info(`Requesting tutor mode ${enabled ? 'enable' : 'disable'}`);
        conference.getMetadataHandler().setMetadata(TUTOR_MODE_METADATA_KEY, { enabled });
    } catch (error) {
        clearRequestTimeout();
        dispatch(setTutorModePending(false));
        dispatch(setTutorModeError('tutorMode.errorGeneric'));
        dispatch(showErrorNotification({
            titleKey: 'tutorMode.errorGeneric'
        }, NOTIFICATION_TIMEOUT_TYPE.MEDIUM));
        logger.error('Failed to write tutor-mode metadata', error);
    }
}

/**
 * Middleware that turns tutor-mode requests into room-metadata writes and keeps
 * the local UI state consistent with the authoritative server value.
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case ENABLE_TUTOR_MODE:
        _requestTutorModeChange(store, true);
        break;
    case DISABLE_TUTOR_MODE:
        _requestTutorModeChange(store, false);
        break;
    case UPDATE_CONFERENCE_METADATA: {
        const result = next(action);
        const state = store.getState();

        // Any metadata update may carry the tutor-mode confirmation.
        if (!state['features/tutor-mode'].pending) {
            return result;
        }

        const { tutorMode, tutorModeCapabilities } = state['features/base/conference'].metadata ?? {};

        if (tutorMode !== undefined) {
            clearRequestTimeout();
            store.dispatch(setTutorModePending(false));
        }

        if (tutorMode?.enabled && tutorModeCapabilities?.enforced !== true) {
            store.dispatch(showWarningNotification({
                titleKey: 'tutorMode.warningNotEnforced'
            }, NOTIFICATION_TIMEOUT_TYPE.STICKY));
        }

        return result;
    }
    case PARTICIPANT_LEFT: {
        const result = next(action);
        const state = store.getState();
        const id = action.participant?.id;

        if (!id) {
            return result;
        }

        const { listenTo } = state['features/tutor-mode'];

        if (listenTo?.includes(id)) {
            store.dispatch(setTutorModeListenTargets(listenTo.filter(target => target !== id)));
        }

        // The server also disables the mode when the tutor leaves; this keeps
        // the local UI responsive if that broadcast is delayed.
        if (isTutorModeEnabled(state) && id === getTutorId(state) && isLocalParticipantModerator(state)) {
            store.dispatch(disableTutorMode());
        }

        return result;
    }
    case PARTICIPANT_ROLE_CHANGED: {
        const result = next(action);
        const state = store.getState();
        const { id, role } = action.participant ?? {};

        // A demoted tutor is no longer allowed to keep the mode on. The server
        // enforces the same rule; this is the client-side half.
        if (id
                && isTutorModeEnabled(state)
                && id === getTutorId(state)
                && id === getLocalParticipantId(state)
                && role !== PARTICIPANT_ROLE.MODERATOR) {
            store.dispatch(disableTutorMode());
        }

        return result;
    }
    }

    return next(action);
});

/**
 * Clears the local tutor-mode state whenever the conference changes, so that a
 * value from a previous room can never leak into a new one.
 */
StateListenerRegistry.register(
    state => getCurrentConference(state),
    (conference, { dispatch }, previousConference) => {
        if (conference !== previousConference) {
            clearRequestTimeout();
            dispatch(clearTutorModeState());
        }
    });

/**
 * Keeps local tutor-mode state in sync with the authoritative metadata and
 * forces the views that cache participant lists to recompute when the mode or
 * the tutor changes.
 */
StateListenerRegistry.register(
    state => ({
        enabled: isTutorModeEnabled(state),
        enforced: isTutorModeCapabilityEnforced(state),
        localId: getLocalParticipantId(state),
        moderator: isLocalParticipantModerator(state),
        tutorId: getTutorId(state)
    }),
    (current, store, previous = {}) => {
        const { dispatch } = store;
        const modeChanged = current.enabled !== previous.enabled;
        const tutorChanged = current.tutorId !== previous.tutorId;

        if (modeChanged || tutorChanged) {
            clearRequestTimeout();
            dispatch(setTutorModePending(false));

            if (!current.enabled) {
                dispatch(setTutorModeListenTargets(null));
            }

            // The filmstrip and large video cache participant lists; force a
            // recomputation so hidden students appear/disappear immediately.
            updateRemoteParticipants(store, true);
            dispatch(selectParticipantInLargeVideo());
        }

        if (modeChanged && current.enabled && !current.enforced) {
            dispatch(showWarningNotification({
                titleKey: 'tutorMode.warningNotEnforced'
            }, NOTIFICATION_TIMEOUT_TYPE.STICKY));
        }

        // If the local moderator was the tutor and lost the role, ask the
        // server to turn the mode off.
        if (previous.tutorId === previous.localId
                && current.localId === previous.localId
                && !current.moderator
                && current.enabled) {
            dispatch(disableTutorMode());
        }
    },
    { deepEquals: true });
