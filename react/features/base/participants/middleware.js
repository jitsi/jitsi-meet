// @flow

import { batch } from 'react-redux';

import UIEvents from '../../../../service/UI/UIEvents';
import { toggleE2EE } from '../../e2ee/actions';
import { NOTIFICATION_TIMEOUT, showNotification } from '../../notifications';
import { CALLING, INVITED } from '../../presence-status';
import { APP_WILL_MOUNT, APP_WILL_UNMOUNT } from '../app';
import {
    CONFERENCE_WILL_JOIN,
    forEachConference,
    getCurrentConference
} from '../conference';
import { JitsiConferenceEvents } from '../lib-jitsi-meet';
import { MiddlewareRegistry, StateListenerRegistry } from '../redux';
import { playSound, registerSound, unregisterSound } from '../sounds';

import {
    DOMINANT_SPEAKER_CHANGED,
    GRANT_MODERATOR,
    KICK_PARTICIPANT,
    LOCAL_PARTICIPANT_RAISE_HAND,
    MUTE_REMOTE_PARTICIPANT,
    PARTICIPANT_DISPLAY_NAME_CHANGED,
    PARTICIPANT_JOINED,
    PARTICIPANT_LEFT,
    PARTICIPANT_UPDATED
} from './actionTypes';
import {
    localParticipantIdChanged,
    localParticipantJoined,
    localParticipantLeft,
    participantLeft,
    participantUpdated,
    setLoadableAvatarUrl
} from './actions';
import {
    LOCAL_PARTICIPANT_DEFAULT_ID,
    PARTICIPANT_JOINED_SOUND_ID,
    PARTICIPANT_LEFT_SOUND_ID
} from './constants';
import {
    getFirstLoadableAvatarUrl,
    getLocalParticipant,
    getParticipantById,
    getParticipantCount,
    getParticipantDisplayName,
    getRemoteParticipants
} from './functions';
import { PARTICIPANT_JOINED_FILE, PARTICIPANT_LEFT_FILE } from './sounds';

declare var APP: Object;

/**
 * Middleware that captures CONFERENCE_JOINED and CONFERENCE_LEFT actions and
 * updates respectively ID of local participant.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case APP_WILL_MOUNT:
        _registerSounds(store);

        return _localParticipantJoined(store, next, action);

    case APP_WILL_UNMOUNT:
        _unregisterSounds(store);

        return _localParticipantLeft(store, next, action);

    case CONFERENCE_WILL_JOIN:
        store.dispatch(localParticipantIdChanged(action.conference.myUserId()));
        break;

    case DOMINANT_SPEAKER_CHANGED: {
        // Ensure the raised hand state is cleared for the dominant speaker
        // and only if it was set when this is the local participant

        const { conference, id } = action.participant;
        const participant = getLocalParticipant(store.getState());
        const isLocal = participant && participant.id === id;

        if (isLocal && participant.raisedHand === undefined) {
            // if local was undefined, let's leave it like that
            // avoids sending unnecessary presence updates
            break;
        }

        participant
            && store.dispatch(participantUpdated({
                conference,
                id,
                local: isLocal,
                raisedHand: false
            }));

        break;
    }

    case GRANT_MODERATOR: {
        const { conference } = store.getState()['features/base/conference'];

        conference.grantOwner(action.id);
        break;
    }

    case KICK_PARTICIPANT: {
        const { conference } = store.getState()['features/base/conference'];

        conference.kickParticipant(action.id);
        break;
    }

    case LOCAL_PARTICIPANT_RAISE_HAND: {
        const { enabled } = action;
        const localId = getLocalParticipant(store.getState())?.id;

        store.dispatch(participantUpdated({
            // XXX Only the local participant is allowed to update without
            // stating the JitsiConference instance (i.e. participant property
            // `conference` for a remote participant) because the local
            // participant is uniquely identified by the very fact that there is
            // only one local participant.

            id: localId,
            local: true,
            raisedHand: enabled
        }));

        if (typeof APP !== 'undefined') {
            APP.API.notifyRaiseHandUpdated(localId, enabled);
        }

        break;
    }

    case MUTE_REMOTE_PARTICIPANT: {
        const { conference } = store.getState()['features/base/conference'];

        conference.muteParticipant(action.id, action.mediaType);
        break;
    }

    // TODO Remove this middleware when the local display name update flow is
    // fully brought into redux.
    case PARTICIPANT_DISPLAY_NAME_CHANGED: {
        if (typeof APP !== 'undefined') {
            const participant = getLocalParticipant(store.getState());

            if (participant && participant.id === action.id) {
                APP.UI.emitEvent(UIEvents.NICKNAME_CHANGED, action.name);
            }
        }

        break;
    }

    case PARTICIPANT_JOINED: {
        _maybePlaySounds(store, action);

        return _participantJoinedOrUpdated(store, next, action);
    }

    case PARTICIPANT_LEFT:
        _maybePlaySounds(store, action);
        break;

    case PARTICIPANT_UPDATED:
        return _participantJoinedOrUpdated(store, next, action);

    }

    return next(action);
});

/**
 * Syncs the redux state features/base/participants up with the redux state
 * features/base/conference by ensuring that the former does not contain remote
 * participants no longer relevant to the latter. Introduced to address an issue
 * with multiplying thumbnails in the filmstrip.
 */
StateListenerRegistry.register(
    /* selector */ state => getCurrentConference(state),
    /* listener */ (conference, { dispatch, getState }) => {
        batch(() => {
            for (const [ id, p ] of getRemoteParticipants(getState())) {
                (!conference || p.conference !== conference)
                    && dispatch(participantLeft(id, p.conference, p.isReplaced));
            }
        });
    });

/**
 * Reset the ID of the local participant to
 * {@link LOCAL_PARTICIPANT_DEFAULT_ID}. Such a reset is deemed possible only if
 * the local participant and, respectively, her ID is not involved in a
 * conference which is still of interest to the user and, consequently, the app.
 * For example, a conference which is in the process of leaving is no longer of
 * interest the user, is unrecoverable from the perspective of the user and,
 * consequently, the app.
 */
StateListenerRegistry.register(
    /* selector */ state => state['features/base/conference'],
    /* listener */ ({ leaving }, { dispatch, getState }) => {
        const state = getState();
        const localParticipant = getLocalParticipant(state);
        let id;

        if (!localParticipant
                || (id = localParticipant.id)
                    === LOCAL_PARTICIPANT_DEFAULT_ID) {
            // The ID of the local participant has been reset already.
            return;
        }

        // The ID of the local may be reset only if it is not in use.
        const dispatchLocalParticipantIdChanged
            = forEachConference(
                state,
                conference =>
                    conference === leaving || conference.myUserId() !== id);

        dispatchLocalParticipantIdChanged
            && dispatch(
                localParticipantIdChanged(LOCAL_PARTICIPANT_DEFAULT_ID));
    });

/**
 * Registers listeners for participant change events.
 */
StateListenerRegistry.register(
    state => state['features/base/conference'].conference,
    (conference, store) => {
        if (conference) {
            const propertyHandlers = {
                'e2ee.enabled': (participant, value) => _e2eeUpdated(store, conference, participant.getId(), value),
                'features_e2ee': (participant, value) =>
                    store.dispatch(participantUpdated({
                        conference,
                        id: participant.getId(),
                        e2eeSupported: value
                    })),
                'features_jigasi': (participant, value) =>
                    store.dispatch(participantUpdated({
                        conference,
                        id: participant.getId(),
                        isJigasi: value
                    })),
                'features_screen-sharing': (participant, value) => // eslint-disable-line no-unused-vars
                    store.dispatch(participantUpdated({
                        conference,
                        id: participant.getId(),
                        features: { 'screen-sharing': true }
                    })),
                'raisedHand': (participant, value) => _raiseHandUpdated(store, conference, participant.getId(), value),
                'remoteControlSessionStatus': (participant, value) =>
                    store.dispatch(participantUpdated({
                        conference,
                        id: participant.getId(),
                        remoteControlSessionStatus: value
                    }))
            };

            // update properties for the participants that are already in the conference
            conference.getParticipants().forEach(participant => {
                Object.keys(propertyHandlers).forEach(propertyName => {
                    const value = participant.getProperty(propertyName);

                    if (value !== undefined) {
                        propertyHandlers[propertyName](participant, value);
                    }
                });
            });

            // We joined a conference
            conference.on(
                JitsiConferenceEvents.PARTICIPANT_PROPERTY_CHANGED,
                (participant, propertyName, oldValue, newValue) => {
                    if (propertyHandlers.hasOwnProperty(propertyName)) {
                        propertyHandlers[propertyName](participant, newValue);
                    }
                });
        } else {
            const localParticipantId = getLocalParticipant(store.getState).id;

            // We left the conference, the local participant must be updated.
            _e2eeUpdated(store, conference, localParticipantId, false);
            _raiseHandUpdated(store, conference, localParticipantId, false);
        }
    }
);

/**
 * Handles a E2EE enabled status update.
 *
 * @param {Function} dispatch - The Redux dispatch function.
 * @param {Object} conference - The conference for which we got an update.
 * @param {string} participantId - The ID of the participant from which we got an update.
 * @param {boolean} newValue - The new value of the E2EE enabled status.
 * @returns {void}
 */
function _e2eeUpdated({ dispatch }, conference, participantId, newValue) {
    const e2eeEnabled = newValue === 'true';

    dispatch(toggleE2EE(e2eeEnabled));

    dispatch(participantUpdated({
        conference,
        id: participantId,
        e2eeEnabled
    }));
}

/**
 * Initializes the local participant and signals that it joined.
 *
 * @private
 * @param {Store} store - The redux store.
 * @param {Dispatch} next - The redux dispatch function to dispatch the
 * specified action to the specified store.
 * @param {Action} action - The redux action which is being dispatched
 * in the specified store.
 * @private
 * @returns {Object} The value returned by {@code next(action)}.
 */
function _localParticipantJoined({ getState, dispatch }, next, action) {
    const result = next(action);

    const settings = getState()['features/base/settings'];

    dispatch(localParticipantJoined({
        avatarURL: settings.avatarURL,
        email: settings.email,
        name: settings.displayName
    }));

    return result;
}

/**
 * Signals that the local participant has left.
 *
 * @param {Store} store - The redux store.
 * @param {Dispatch} next - The redux {@code dispatch} function to dispatch the
 * specified {@code action} into the specified {@code store}.
 * @param {Action} action - The redux action which is being dispatched in the
 * specified {@code store}.
 * @private
 * @returns {Object} The value returned by {@code next(action)}.
 */
function _localParticipantLeft({ dispatch }, next, action) {
    const result = next(action);

    dispatch(localParticipantLeft());

    return result;
}

/**
 * Plays sounds when participants join/leave conference.
 *
 * @param {Store} store - The redux store.
 * @param {Action} action - The redux action. Should be either
 * {@link PARTICIPANT_JOINED} or {@link PARTICIPANT_LEFT}.
 * @private
 * @returns {void}
 */
function _maybePlaySounds({ getState, dispatch }, action) {
    const state = getState();
    const { startAudioMuted, disableJoinLeaveSounds } = state['features/base/config'];
    const { soundsParticipantJoined: joinSound, soundsParticipantLeft: leftSound } = state['features/base/settings'];

    // If we have join/leave sounds disabled, don't play anything.
    if (disableJoinLeaveSounds) {
        return;
    }

    // We're not playing sounds for local participant
    // nor when the user is joining past the "startAudioMuted" limit.
    // The intention there was to not play user joined notification in big
    // conferences where 100th person is joining.
    if (!action.participant.local
            && (!startAudioMuted
                || getParticipantCount(state) < startAudioMuted)) {
        const { isReplacing, isReplaced } = action.participant;

        if (action.type === PARTICIPANT_JOINED) {
            if (!joinSound) {
                return;
            }
            const { presence } = action.participant;

            // The sounds for the poltergeist are handled by features/invite.
            if (presence !== INVITED && presence !== CALLING && !isReplacing) {
                dispatch(playSound(PARTICIPANT_JOINED_SOUND_ID));
            }
        } else if (action.type === PARTICIPANT_LEFT && !isReplaced && leftSound) {
            dispatch(playSound(PARTICIPANT_LEFT_SOUND_ID));
        }
    }
}

/**
 * Notifies the feature base/participants that the action
 * {@code PARTICIPANT_JOINED} or {@code PARTICIPANT_UPDATED} is being dispatched
 * within a specific redux store.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Dispatch} next - The redux {@code dispatch} function to dispatch the
 * specified {@code action} in the specified {@code store}.
 * @param {Action} action - The redux action {@code PARTICIPANT_JOINED} or
 * {@code PARTICIPANT_UPDATED} which is being dispatched in the specified
 * {@code store}.
 * @private
 * @returns {Object} The value returned by {@code next(action)}.
 */
function _participantJoinedOrUpdated(store, next, action) {
    const { dispatch, getState } = store;
    const { participant: { avatarURL, email, id, local, name, raisedHand } } = action;

    // Send an external update of the local participant's raised hand state
    // if a new raised hand state is defined in the action.
    if (typeof raisedHand !== 'undefined') {
        if (local) {
            const { conference } = getState()['features/base/conference'];

            // Send raisedHand signalling only if there is a change
            if (conference && raisedHand !== getLocalParticipant(getState()).raisedHand) {
                conference.setLocalParticipantProperty('raisedHand', raisedHand);
            }
        }
    }

    // Allow the redux update to go through and compare the old avatar
    // to the new avatar and emit out change events if necessary.
    const result = next(action);

    // Only run this if the config is populated, otherwise we preload external resources
    // even if disableThirdPartyRequests is set to true in config
    if (Object.keys(getState()['features/base/config']).length) {
        const { disableThirdPartyRequests } = getState()['features/base/config'];

        if (!disableThirdPartyRequests && (avatarURL || email || id || name)) {
            const participantId = !id && local ? getLocalParticipant(getState()).id : id;
            const updatedParticipant = getParticipantById(getState(), participantId);

            getFirstLoadableAvatarUrl(updatedParticipant, store)
                .then(url => {
                    dispatch(setLoadableAvatarUrl(participantId, url));
                });
        }
    }

    // Notify external listeners of potential avatarURL changes.
    if (typeof APP === 'object') {
        const currentKnownId = local ? APP.conference.getMyUserId() : id;

        // Force update of local video getting a new id.
        APP.UI.refreshAvatarDisplay(currentKnownId);
    }

    return result;
}

/**
 * Handles a raise hand status update.
 *
 * @param {Function} dispatch - The Redux dispatch function.
 * @param {Object} conference - The conference for which we got an update.
 * @param {string} participantId - The ID of the participant from which we got an update.
 * @param {boolean} newValue - The new value of the raise hand status.
 * @returns {void}
 */
function _raiseHandUpdated({ dispatch, getState }, conference, participantId, newValue) {
    const raisedHand = newValue === 'true';

    dispatch(participantUpdated({
        conference,
        id: participantId,
        raisedHand
    }));

    if (typeof APP !== 'undefined') {
        APP.API.notifyRaiseHandUpdated(participantId, raisedHand);
    }

    if (raisedHand) {
        dispatch(showNotification({
            titleArguments: {
                name: getParticipantDisplayName(getState, participantId)
            },
            titleKey: 'notify.raisedHand'
        }, NOTIFICATION_TIMEOUT));
    }
}

/**
 * Registers sounds related with the participants feature.
 *
 * @param {Store} store - The redux store.
 * @private
 * @returns {void}
 */
function _registerSounds({ dispatch }) {
    dispatch(
        registerSound(PARTICIPANT_JOINED_SOUND_ID, PARTICIPANT_JOINED_FILE));
    dispatch(registerSound(PARTICIPANT_LEFT_SOUND_ID, PARTICIPANT_LEFT_FILE));
}

/**
 * Unregisters sounds related with the participants feature.
 *
 * @param {Store} store - The redux store.
 * @private
 * @returns {void}
 */
function _unregisterSounds({ dispatch }) {
    dispatch(unregisterSound(PARTICIPANT_JOINED_SOUND_ID));
    dispatch(unregisterSound(PARTICIPANT_LEFT_SOUND_ID));
}
