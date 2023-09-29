import i18n from 'i18next';
import { batch } from 'react-redux';
import { AnyAction } from 'redux';

// @ts-expect-error
import UIEvents from '../../../../service/UI/UIEvents';
import { IStore } from '../../app/types';
import { approveParticipant } from '../../av-moderation/actions';
import { UPDATE_BREAKOUT_ROOMS } from '../../breakout-rooms/actionTypes';
import { getBreakoutRooms } from '../../breakout-rooms/functions';
import { toggleE2EE } from '../../e2ee/actions';
import { MAX_MODE } from '../../e2ee/constants';
import { showNotification } from '../../notifications/actions';
import {
    LOCAL_RECORDING_NOTIFICATION_ID,
    NOTIFICATION_TIMEOUT_TYPE,
    RAISE_HAND_NOTIFICATION_ID
} from '../../notifications/constants';
import { isForceMuted } from '../../participants-pane/functions';
import { CALLING, INVITED } from '../../presence-status/constants';
import { RAISE_HAND_SOUND_ID } from '../../reactions/constants';
import { RECORDING_OFF_SOUND_ID, RECORDING_ON_SOUND_ID } from '../../recording/constants';
import { APP_WILL_MOUNT, APP_WILL_UNMOUNT } from '../app/actionTypes';
import { CONFERENCE_WILL_JOIN } from '../conference/actionTypes';
import { forEachConference, getCurrentConference } from '../conference/functions';
import { IJitsiConference } from '../conference/reducer';
import { SET_CONFIG } from '../config/actionTypes';
import { getDisableRemoveRaisedHandOnFocus } from '../config/functions.any';
import { JitsiConferenceEvents } from '../lib-jitsi-meet';
import { MEDIA_TYPE } from '../media/constants';
import MiddlewareRegistry from '../redux/MiddlewareRegistry';
import StateListenerRegistry from '../redux/StateListenerRegistry';
import { playSound, registerSound, unregisterSound } from '../sounds/actions';

import {
    DOMINANT_SPEAKER_CHANGED,
    GRANT_MODERATOR,
    KICK_PARTICIPANT,
    LOCAL_PARTICIPANT_AUDIO_LEVEL_CHANGED,
    LOCAL_PARTICIPANT_RAISE_HAND,
    MUTE_REMOTE_PARTICIPANT,
    OVERWRITE_PARTICIPANTS_NAMES,
    OVERWRITE_PARTICIPANT_NAME,
    PARTICIPANT_DISPLAY_NAME_CHANGED,
    PARTICIPANT_JOINED,
    PARTICIPANT_LEFT,
    PARTICIPANT_UPDATED,
    RAISE_HAND_UPDATED,
    SET_LOCAL_PARTICIPANT_RECORDING_STATUS
} from './actionTypes';
import {
    localParticipantIdChanged,
    localParticipantJoined,
    localParticipantLeft,
    overwriteParticipantName,
    participantLeft,
    participantUpdated,
    raiseHand,
    raiseHandUpdateQueue,
    setLoadableAvatarUrl
} from './actions';
import {
    LOCAL_PARTICIPANT_DEFAULT_ID,
    LOWER_HAND_AUDIO_LEVEL,
    PARTICIPANT_JOINED_SOUND_ID,
    PARTICIPANT_LEFT_SOUND_ID
} from './constants';
import {
    getDominantSpeakerParticipant,
    getFirstLoadableAvatarUrl,
    getLocalParticipant,
    getParticipantById,
    getParticipantCount,
    getParticipantDisplayName,
    getRaiseHandsQueue,
    getRemoteParticipants,
    hasRaisedHand,
    isLocalParticipantModerator,
    isScreenShareParticipant,
    isWhiteboardParticipant
} from './functions';
import logger from './logger';
import { PARTICIPANT_JOINED_FILE, PARTICIPANT_LEFT_FILE } from './sounds';
import { IJitsiParticipant } from './types';

import './subscriber';

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
        // Lower hand through xmpp when local participant becomes dominant speaker.
        const { id } = action.participant;
        const state = store.getState();
        const participant = getLocalParticipant(state);
        const dominantSpeaker = getDominantSpeakerParticipant(state);
        const isLocal = participant && participant.id === id;

        if (isLocal && dominantSpeaker?.id !== id
                && hasRaisedHand(participant)
                && !getDisableRemoveRaisedHandOnFocus(state)) {
            store.dispatch(raiseHand(false));
        }

        break;
    }

    case LOCAL_PARTICIPANT_AUDIO_LEVEL_CHANGED: {
        const state = store.getState();
        const participant = getDominantSpeakerParticipant(state);

        if (
            participant?.local
            && hasRaisedHand(participant)
            && action.level > LOWER_HAND_AUDIO_LEVEL
            && !getDisableRemoveRaisedHandOnFocus(state)
        ) {
            store.dispatch(raiseHand(false));
        }
        break;
    }

    case GRANT_MODERATOR: {
        const { conference } = store.getState()['features/base/conference'];

        conference?.grantOwner(action.id);
        break;
    }

    case KICK_PARTICIPANT: {
        const { conference } = store.getState()['features/base/conference'];

        conference?.kickParticipant(action.id);
        break;
    }

    case LOCAL_PARTICIPANT_RAISE_HAND: {
        const { raisedHandTimestamp } = action;
        const localId = getLocalParticipant(store.getState())?.id;

        store.dispatch(participantUpdated({
            // XXX Only the local participant is allowed to update without
            // stating the JitsiConference instance (i.e. participant property
            // `conference` for a remote participant) because the local
            // participant is uniquely identified by the very fact that there is
            // only one local participant.

            id: localId ?? '',
            local: true,
            raisedHandTimestamp
        }));

        store.dispatch(raiseHandUpdateQueue({
            id: localId ?? '',
            raisedHandTimestamp
        }));

        if (typeof APP !== 'undefined') {
            APP.API.notifyRaiseHandUpdated(localId, raisedHandTimestamp);
        }

        break;
    }

    case SET_CONFIG: {
        const result = next(action);

        const state = store.getState();
        const { deploymentInfo } = state['features/base/config'];

        // if there userRegion set let's use it for the local participant
        if (deploymentInfo?.userRegion) {
            const localId = getLocalParticipant(state)?.id;

            if (localId) {
                store.dispatch(participantUpdated({
                    id: localId,
                    local: true,
                    region: deploymentInfo.userRegion
                }));
            }
        }

        return result;
    }

    case SET_LOCAL_PARTICIPANT_RECORDING_STATUS: {
        const state = store.getState();
        const { recording, onlySelf } = action;
        const localId = getLocalParticipant(state)?.id;
        const { localRecording } = state['features/base/config'];

        if (localRecording?.notifyAllParticipants && !onlySelf && localId) {
            store.dispatch(participantUpdated({
                // XXX Only the local participant is allowed to update without
                // stating the JitsiConference instance (i.e. participant property
                // `conference` for a remote participant) because the local
                // participant is uniquely identified by the very fact that there is
                // only one local participant.

                id: localId,
                local: true,
                localRecording: recording
            }));
        }

        break;
    }

    case MUTE_REMOTE_PARTICIPANT: {
        const { conference } = store.getState()['features/base/conference'];

        conference?.muteParticipant(action.id, action.mediaType);
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

    case RAISE_HAND_UPDATED: {
        const { participant } = action;
        let queue = getRaiseHandsQueue(store.getState());

        if (participant.raisedHandTimestamp) {
            queue.push({
                id: participant.id,
                raisedHandTimestamp: participant.raisedHandTimestamp
            });

            // sort the queue before adding to store.
            queue = queue.sort(({ raisedHandTimestamp: a }, { raisedHandTimestamp: b }) => a - b);
        } else {
            // no need to sort on remove value.
            queue = queue.filter(({ id }) => id !== participant.id);
        }

        action.queue = queue;
        break;
    }

    case PARTICIPANT_JOINED: {
        // Do not play sounds when a screenshare or whiteboard participant tile is created for screenshare.
        (!isScreenShareParticipant(action.participant)
            && !isWhiteboardParticipant(action.participant)
        ) && _maybePlaySounds(store, action);

        return _participantJoinedOrUpdated(store, next, action);
    }

    case PARTICIPANT_LEFT: {
        // Do not play sounds when a tile for screenshare or whiteboard is removed.
        (!isScreenShareParticipant(action.participant)
            && !isWhiteboardParticipant(action.participant)
        ) && _maybePlaySounds(store, action);

        break;
    }

    case PARTICIPANT_UPDATED:
        return _participantJoinedOrUpdated(store, next, action);

    case OVERWRITE_PARTICIPANTS_NAMES: {
        const { participantList } = action;

        if (!Array.isArray(participantList)) {
            logger.error('Overwrite names failed. Argument is not an array.');

            return;
        }
        batch(() => {
            participantList.forEach(p => {
                store.dispatch(overwriteParticipantName(p.id, p.name));
            });
        });
        break;
    }

    case OVERWRITE_PARTICIPANT_NAME: {
        const { dispatch, getState } = store;
        const state = getState();
        const { id, name } = action;

        let breakoutRoom = false, identifier = id;

        if (id.indexOf('@') !== -1) {
            identifier = id.slice(id.indexOf('/') + 1);
            breakoutRoom = true;
            action.id = identifier;
        }

        if (breakoutRoom) {
            const rooms = getBreakoutRooms(state);
            const roomCounter = state['features/breakout-rooms'].roomCounter;
            const newRooms: any = {};

            Object.entries(rooms).forEach(([ key, r ]) => {
                const participants = r?.participants || {};
                const jid = Object.keys(participants).find(p =>
                    p.slice(p.indexOf('/') + 1) === identifier);

                if (jid) {
                    newRooms[key] = {
                        ...r,
                        participants: {
                            ...participants,
                            [jid]: {
                                ...participants[jid],
                                displayName: name
                            }
                        }
                    };
                } else {
                    newRooms[key] = r;
                }
            });
            dispatch({
                type: UPDATE_BREAKOUT_ROOMS,
                rooms,
                roomCounter,
                updatedNames: true
            });
        } else {
            dispatch(participantUpdated({
                id: identifier,
                name
            }));
        }
        break;
    }
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
                    && dispatch(participantLeft(id, p.conference, {
                        isReplaced: p.isReplaced
                    }));
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
        let id: string;

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
            const propertyHandlers: {
                [key: string]: Function;
            } = {
                'e2ee.enabled': (participant: IJitsiParticipant, value: string) =>
                    _e2eeUpdated(store, conference, participant.getId(), value),
                'features_e2ee': (participant: IJitsiParticipant, value: boolean) =>
                    getParticipantById(store.getState(), participant.getId())?.e2eeSupported !== value
                        && store.dispatch(participantUpdated({
                            conference,
                            id: participant.getId(),
                            e2eeSupported: value
                        })),
                'features_jigasi': (participant: IJitsiParticipant, value: boolean) =>
                    store.dispatch(participantUpdated({
                        conference,
                        id: participant.getId(),
                        isJigasi: value
                    })),
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                'features_screen-sharing': (participant: IJitsiParticipant, value: string) =>
                    store.dispatch(participantUpdated({
                        conference,
                        id: participant.getId(),
                        features: { 'screen-sharing': true }
                    })),
                'localRecording': (participant: IJitsiParticipant, value: string) =>
                    _localRecordingUpdated(store, conference, participant.getId(), value),
                'raisedHand': (participant: IJitsiParticipant, value: string) =>
                    _raiseHandUpdated(store, conference, participant.getId(), value),
                'region': (participant: IJitsiParticipant, value: string) =>
                    store.dispatch(participantUpdated({
                        conference,
                        id: participant.getId(),
                        region: value
                    })),
                'remoteControlSessionStatus': (participant: IJitsiParticipant, value: boolean) =>
                    store.dispatch(participantUpdated({
                        conference,
                        id: participant.getId(),
                        remoteControlSessionStatus: value
                    }))
            };

            // update properties for the participants that are already in the conference
            conference.getParticipants().forEach((participant: any) => {
                Object.keys(propertyHandlers).forEach(propertyName => {
                    const value = participant.getProperty(propertyName);

                    if (value !== undefined) {
                        propertyHandlers[propertyName as keyof typeof propertyHandlers](participant, value);
                    }
                });
            });

            // We joined a conference
            conference.on(
                JitsiConferenceEvents.PARTICIPANT_PROPERTY_CHANGED,
                (participant: IJitsiParticipant, propertyName: string, oldValue: string, newValue: string) => {
                    if (propertyHandlers.hasOwnProperty(propertyName)) {
                        propertyHandlers[propertyName](participant, newValue);
                    }
                });
        } else {
            const localParticipantId = getLocalParticipant(store.getState)?.id;

            // We left the conference, the local participant must be updated.
            _e2eeUpdated(store, conference, localParticipantId ?? '', false);
            _raiseHandUpdated(store, conference, localParticipantId ?? '', 0);
        }
    }
);

/**
 * Handles a E2EE enabled status update.
 *
 * @param {Store} store - The redux store.
 * @param {Object} conference - The conference for which we got an update.
 * @param {string} participantId - The ID of the participant from which we got an update.
 * @param {boolean} newValue - The new value of the E2EE enabled status.
 * @returns {void}
 */
function _e2eeUpdated({ getState, dispatch }: IStore, conference: IJitsiConference,
        participantId: string, newValue: string | boolean) {
    const e2eeEnabled = newValue === 'true';
    const state = getState();
    const { e2ee = {} } = state['features/base/config'];

    if (e2eeEnabled === getParticipantById(state, participantId)?.e2eeEnabled) {
        return;
    }

    dispatch(participantUpdated({
        conference,
        id: participantId,
        e2eeEnabled
    }));

    if (e2ee.externallyManagedKey) {
        return;
    }

    const { maxMode } = getState()['features/e2ee'] || {};

    if (maxMode !== MAX_MODE.THRESHOLD_EXCEEDED || !e2eeEnabled) {
        dispatch(toggleE2EE(e2eeEnabled));
    }
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
function _localParticipantJoined({ getState, dispatch }: IStore, next: Function, action: AnyAction) {
    const result = next(action);

    const settings = getState()['features/base/settings'];

    dispatch(localParticipantJoined({
        avatarURL: settings.avatarURL,
        email: settings.email,
        name: settings.displayName,
        id: ''
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
function _localParticipantLeft({ dispatch }: IStore, next: Function, action: AnyAction) {
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
function _maybePlaySounds({ getState, dispatch }: IStore, action: AnyAction) {
    const state = getState();
    const { startAudioMuted } = state['features/base/config'];
    const { soundsParticipantJoined: joinSound, soundsParticipantLeft: leftSound } = state['features/base/settings'];

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
function _participantJoinedOrUpdated(store: IStore, next: Function, action: AnyAction) {
    const { dispatch, getState } = store;
    const { overwrittenNameList } = store.getState()['features/base/participants'];
    const { participant: {
        avatarURL,
        email,
        id,
        local,
        localRecording,
        name,
        raisedHandTimestamp
    } } = action;

    // Send an external update of the local participant's raised hand state
    // if a new raised hand state is defined in the action.
    if (typeof raisedHandTimestamp !== 'undefined') {
        if (local) {
            const { conference } = getState()['features/base/conference'];
            const rHand = parseInt(raisedHandTimestamp, 10);

            // Send raisedHand signalling only if there is a change
            if (conference && rHand !== getLocalParticipant(getState())?.raisedHandTimestamp) {
                conference.setLocalParticipantProperty('raisedHand', rHand);
            }
        }
    }

    if (overwrittenNameList[id]) {
        action.participant.name = overwrittenNameList[id];
    }

    // Send an external update of the local participant's local recording state
    // if a new local recording state is defined in the action.
    if (typeof localRecording !== 'undefined') {
        if (local) {
            const conference = getCurrentConference(getState);

            // Send localRecording signalling only if there is a change
            if (conference
                && localRecording !== getLocalParticipant(getState())?.localRecording) {
                conference.setLocalParticipantProperty('localRecording', localRecording);
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
            const participantId = !id && local ? getLocalParticipant(getState())?.id : id;
            const updatedParticipant = getParticipantById(getState(), participantId);

            getFirstLoadableAvatarUrl(updatedParticipant ?? { id: '' }, store)
                .then((urlData?: { isUsingCORS: boolean; src: string; }) => {
                    dispatch(setLoadableAvatarUrl(participantId, urlData?.src ?? '', Boolean(urlData?.isUsingCORS)));
                });
        }
    }

    return result;
}

/**
 * Handles a local recording status update.
 *
 * @param {Function} dispatch - The Redux dispatch function.
 * @param {Object} conference - The conference for which we got an update.
 * @param {string} participantId - The ID of the participant from which we got an update.
 * @param {boolean} newValue - The new value of the local recording status.
 * @returns {void}
 */
function _localRecordingUpdated({ dispatch, getState }: IStore, conference: IJitsiConference,
        participantId: string, newValue: string) {
    const state = getState();

    dispatch(participantUpdated({
        conference,
        id: participantId,
        localRecording: newValue
    }));
    const participantName = getParticipantDisplayName(state, participantId);

    dispatch(showNotification({
        titleKey: 'notify.somebody',
        title: participantName,
        descriptionKey: newValue ? 'notify.localRecordingStarted' : 'notify.localRecordingStopped',
        uid: LOCAL_RECORDING_NOTIFICATION_ID
    }, NOTIFICATION_TIMEOUT_TYPE.MEDIUM));
    dispatch(playSound(newValue ? RECORDING_ON_SOUND_ID : RECORDING_OFF_SOUND_ID));
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
function _raiseHandUpdated({ dispatch, getState }: IStore, conference: IJitsiConference,
        participantId: string, newValue: string | number) {
    let raisedHandTimestamp;

    switch (newValue) {
    case undefined:
    case 'false':
        raisedHandTimestamp = 0;
        break;
    case 'true':
        raisedHandTimestamp = Date.now();
        break;
    default:
        raisedHandTimestamp = parseInt(`${newValue}`, 10);
    }
    const state = getState();

    dispatch(participantUpdated({
        conference,
        id: participantId,
        raisedHandTimestamp
    }));

    dispatch(raiseHandUpdateQueue({
        id: participantId,
        raisedHandTimestamp
    }));

    if (typeof APP !== 'undefined') {
        APP.API.notifyRaiseHandUpdated(participantId, raisedHandTimestamp);
    }

    const isModerator = isLocalParticipantModerator(state);
    const participant = getParticipantById(state, participantId);
    let shouldDisplayAllowAction = false;

    if (isModerator) {
        shouldDisplayAllowAction = isForceMuted(participant, MEDIA_TYPE.AUDIO, state)
            || isForceMuted(participant, MEDIA_TYPE.VIDEO, state);
    }

    const action = shouldDisplayAllowAction ? {
        customActionNameKey: [ 'notify.allowAction' ],
        customActionHandler: [ () => dispatch(approveParticipant(participantId)) ]
    } : {};

    if (raisedHandTimestamp) {
        let notificationTitle;
        const participantName = getParticipantDisplayName(state, participantId);
        const { raisedHandsQueue } = state['features/base/participants'];

        if (raisedHandsQueue.length > 1) {
            const raisedHands = raisedHandsQueue.length - 1;

            notificationTitle = i18n.t('notify.raisedHands', {
                participantName,
                raisedHands
            });
        } else {
            notificationTitle = participantName;
        }
        dispatch(showNotification({
            titleKey: 'notify.somebody',
            title: notificationTitle,
            descriptionKey: 'notify.raisedHand',
            concatText: true,
            uid: RAISE_HAND_NOTIFICATION_ID,
            ...action
        }, shouldDisplayAllowAction ? NOTIFICATION_TIMEOUT_TYPE.MEDIUM : NOTIFICATION_TIMEOUT_TYPE.SHORT));
        dispatch(playSound(RAISE_HAND_SOUND_ID));
    }
}

/**
 * Registers sounds related with the participants feature.
 *
 * @param {Store} store - The redux store.
 * @private
 * @returns {void}
 */
function _registerSounds({ dispatch }: IStore) {
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
function _unregisterSounds({ dispatch }: IStore) {
    dispatch(unregisterSound(PARTICIPANT_JOINED_SOUND_ID));
    dispatch(unregisterSound(PARTICIPANT_LEFT_SOUND_ID));
}
