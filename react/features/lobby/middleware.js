// @flow

import i18n from 'i18next';
import { batch } from 'react-redux';

import { APP_WILL_MOUNT, APP_WILL_UNMOUNT } from '../base/app';
import {
    CONFERENCE_FAILED,
    CONFERENCE_JOINED,
    conferenceWillJoin
} from '../base/conference';
import { JitsiConferenceErrors, JitsiConferenceEvents } from '../base/lib-jitsi-meet';
import { getFirstLoadableAvatarUrl, getParticipantDisplayName } from '../base/participants';
import { MiddlewareRegistry, StateListenerRegistry } from '../base/redux';
import { playSound, registerSound, unregisterSound } from '../base/sounds';
import { isTestModeEnabled } from '../base/testing';
import { handleLobbyChatInitialized, removeLobbyChatParticipant } from '../chat/actions.any';
import { approveKnockingParticipant, rejectKnockingParticipant } from '../lobby/actions';
import {
    LOBBY_NOTIFICATION_ID,
    NOTIFICATION_ICON,
    NOTIFICATION_TIMEOUT_TYPE,
    NOTIFICATION_TYPE,
    hideNotification,
    showNotification
} from '../notifications';
import { open as openParticipantsPane } from '../participants-pane/actions';
import { getParticipantsPaneOpen } from '../participants-pane/functions';
import { shouldAutoKnock } from '../prejoin/functions';

import { KNOCKING_PARTICIPANT_ARRIVED_OR_UPDATED, KNOCKING_PARTICIPANT_LEFT } from './actionTypes';
import {
    hideLobbyScreen,
    knockingParticipantLeft,
    openLobbyScreen,
    participantIsKnockingOrUpdated,
    setLobbyModeEnabled,
    startKnocking,
    setPasswordJoinFailed,
    setLobbyMessageListener
} from './actions';
import { updateLobbyParticipantOnLeave } from './actions.any';
import { KNOCKING_PARTICIPANT_SOUND_ID } from './constants';
import { getKnockingParticipants, showLobbyChatButton } from './functions';
import { KNOCKING_PARTICIPANT_FILE } from './sounds';

declare var APP: Object;

MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case APP_WILL_MOUNT:
        store.dispatch(registerSound(KNOCKING_PARTICIPANT_SOUND_ID, KNOCKING_PARTICIPANT_FILE));
        break;
    case APP_WILL_UNMOUNT:
        store.dispatch(unregisterSound(KNOCKING_PARTICIPANT_SOUND_ID));
        break;
    case CONFERENCE_FAILED:
        return _conferenceFailed(store, next, action);
    case CONFERENCE_JOINED:
        return _conferenceJoined(store, next, action);
    case KNOCKING_PARTICIPANT_ARRIVED_OR_UPDATED: {
        // We need the full update result to be in the store already
        const result = next(action);

        _findLoadableAvatarForKnockingParticipant(store, action.participant);
        _handleLobbyNotification(store);

        return result;
    }
    case KNOCKING_PARTICIPANT_LEFT: {
        // We need the full update result to be in the store already
        const result = next(action);

        _handleLobbyNotification(store);

        return result;
    }
    }

    return next(action);
});

/**
 * Registers a change handler for state['features/base/conference'].conference to
 * set the event listeners needed for the lobby feature to operate.
 */
StateListenerRegistry.register(
    state => state['features/base/conference'].conference,
    (conference, { dispatch, getState }, previousConference) => {
        if (conference && !previousConference) {
            conference.on(JitsiConferenceEvents.MEMBERS_ONLY_CHANGED, enabled => {
                dispatch(setLobbyModeEnabled(enabled));
                if (enabled) {
                    dispatch(setLobbyMessageListener());
                }
            });

            conference.on(JitsiConferenceEvents.LOBBY_USER_JOINED, (id, name) => {
                batch(() => {
                    dispatch(
                        participantIsKnockingOrUpdated({
                            id,
                            name
                        })
                    );
                    dispatch(playSound(KNOCKING_PARTICIPANT_SOUND_ID));

                    const isParticipantsPaneVisible = getParticipantsPaneOpen(getState());

                    if (navigator.product === 'ReactNative' || isParticipantsPaneVisible) {
                        return;
                    }

                    _handleLobbyNotification({
                        dispatch,
                        getState
                    });

                    let notificationTitle;
                    let customActionNameKey;
                    let customActionHandler;
                    let descriptionKey;
                    let icon;

                    const knockingParticipants = getKnockingParticipants(getState());
                    const firstParticipant = knockingParticipants[0];
                    const showChat = showLobbyChatButton(firstParticipant)(getState());

                    if (knockingParticipants.length > 1) {
                        descriptionKey = 'notify.participantsWantToJoin';
                        notificationTitle = i18n.t('notify.waitingParticipants', {
                            waitingParticipants: knockingParticipants.length
                        });
                        icon = NOTIFICATION_ICON.PARTICIPANTS;
                        customActionNameKey = [ 'notify.viewLobby' ];
                        customActionHandler = [ () => batch(() => {
                            dispatch(hideNotification(LOBBY_NOTIFICATION_ID));
                            dispatch(openParticipantsPane());
                        }) ];
                    } else {
                        descriptionKey = 'notify.participantWantsToJoin';
                        notificationTitle = firstParticipant.name;
                        icon = NOTIFICATION_ICON.PARTICIPANT;
                        customActionNameKey = [ 'lobby.admit', 'lobby.reject' ];
                        customActionHandler = [ () => batch(() => {
                            dispatch(hideNotification(LOBBY_NOTIFICATION_ID));
                            dispatch(approveKnockingParticipant(firstParticipant.id));
                        }),
                        () => batch(() => {
                            dispatch(hideNotification(LOBBY_NOTIFICATION_ID));
                            dispatch(rejectKnockingParticipant(firstParticipant.id));
                        }) ];
                        if (showChat) {
                            customActionNameKey.splice(1, 0, 'lobby.chat');
                            customActionHandler.splice(1, 0, () => batch(() => {
                                dispatch(hideNotification(LOBBY_NOTIFICATION_ID));
                                dispatch(handleLobbyChatInitialized(firstParticipant.id));
                            }));
                        }
                    }
                    dispatch(showNotification({
                        title: notificationTitle,
                        descriptionKey,
                        uid: LOBBY_NOTIFICATION_ID,
                        customActionNameKey,
                        customActionHandler,
                        icon
                    }, NOTIFICATION_TIMEOUT_TYPE.STICKY));

                    if (typeof APP !== 'undefined') {
                        APP.API.notifyKnockingParticipant({
                            id,
                            name
                        });
                    }
                });
            });

            conference.on(JitsiConferenceEvents.LOBBY_USER_UPDATED, (id, participant) => {
                dispatch(
                    participantIsKnockingOrUpdated({
                        ...participant,
                        id
                    })
                );
            });

            conference.on(JitsiConferenceEvents.LOBBY_USER_LEFT, id => {
                batch(() => {
                    dispatch(knockingParticipantLeft(id));
                    dispatch(removeLobbyChatParticipant());
                    dispatch(updateLobbyParticipantOnLeave(id));
                });
            });

            conference.on(JitsiConferenceEvents.ENDPOINT_MESSAGE_RECEIVED, (origin, sender) =>
                _maybeSendLobbyNotification(origin, sender, {
                    dispatch,
                    getState
                })
            );
        }
    }
);

/**
 * Function to handle the lobby notification.
 *
 * @param {Object} store - The Redux store.
 * @returns {void}
 */
function _handleLobbyNotification(store) {
    const { dispatch, getState } = store;
    const knockingParticipants = getKnockingParticipants(getState());

    if (knockingParticipants.length === 0) {
        dispatch(hideNotification(LOBBY_NOTIFICATION_ID));

        return;
    }

    let notificationTitle;
    let customActionNameKey;
    let customActionHandler;
    let descriptionKey;
    let icon;

    if (knockingParticipants.length === 1) {
        const firstParticipant = knockingParticipants[0];

        descriptionKey = 'notify.participantWantsToJoin';
        notificationTitle = firstParticipant.name;
        icon = NOTIFICATION_ICON.PARTICIPANT;
        customActionNameKey = [ 'lobby.admit', 'lobby.reject' ];
        customActionHandler = [ () => batch(() => {
            dispatch(hideNotification(LOBBY_NOTIFICATION_ID));
            dispatch(approveKnockingParticipant(firstParticipant.id));
        }),
        () => batch(() => {
            dispatch(hideNotification(LOBBY_NOTIFICATION_ID));
            dispatch(rejectKnockingParticipant(firstParticipant.id));
        }) ];
    } else {
        descriptionKey = 'notify.participantsWantToJoin';
        notificationTitle = i18n.t('notify.waitingParticipants', {
            waitingParticipants: knockingParticipants.length
        });
        icon = NOTIFICATION_ICON.PARTICIPANTS;
        customActionNameKey = [ 'notify.viewLobby' ];
        customActionHandler = [ () => batch(() => {
            dispatch(hideNotification(LOBBY_NOTIFICATION_ID));
            dispatch(openParticipantsPane());
        }) ];
    }
    dispatch(showNotification({
        title: notificationTitle,
        descriptionKey,
        uid: LOBBY_NOTIFICATION_ID,
        customActionNameKey,
        customActionHandler,
        icon
    }, NOTIFICATION_TIMEOUT_TYPE.STICKY));
}

/**
 * Function to handle the conference failed event and navigate the user to the lobby screen
 * based on the failure reason.
 *
 * @param {Object} store - The Redux store.
 * @param {Function} next - The Redux next function.
 * @param {Object} action - The Redux action.
 * @returns {Object}
 */
function _conferenceFailed({ dispatch, getState }, next, action) {
    const { error } = action;
    const state = getState();
    const { membersOnly } = state['features/base/conference'];
    const nonFirstFailure = Boolean(membersOnly);

    if (error.name === JitsiConferenceErrors.MEMBERS_ONLY_ERROR) {
        if (typeof error.recoverable === 'undefined') {
            error.recoverable = true;
        }

        const result = next(action);

        dispatch(openLobbyScreen());

        if (shouldAutoKnock(state)) {
            dispatch(startKnocking());
        }

        // In case of wrong password we need to be in the right state if in the meantime someone allows us to join
        if (nonFirstFailure) {
            dispatch(conferenceWillJoin(membersOnly));
        }

        dispatch(setPasswordJoinFailed(nonFirstFailure));

        return result;
    }

    dispatch(hideLobbyScreen());

    if (error.name === JitsiConferenceErrors.CONFERENCE_ACCESS_DENIED) {
        dispatch(
            showNotification({
                appearance: NOTIFICATION_TYPE.ERROR,
                hideErrorSupportLink: true,
                titleKey: 'lobby.joinRejectedMessage'
            }, NOTIFICATION_TIMEOUT_TYPE.LONG)
        );
    }

    return next(action);
}

/**
 * Handles cleanup of lobby state when a conference is joined.
 *
 * @param {Object} store - The Redux store.
 * @param {Function} next - The Redux next function.
 * @param {Object} action - The Redux action.
 * @returns {Object}
 */
function _conferenceJoined({ dispatch }, next, action) {
    dispatch(hideLobbyScreen());

    return next(action);
}

/**
 * Finds the loadable avatar URL and updates the participant accordingly.
 *
 * @param {Object} store - The Redux store.
 * @param {Object} participant - The knocking participant.
 * @returns {void}
 */
function _findLoadableAvatarForKnockingParticipant(store, { id }) {
    const { dispatch, getState } = store;
    const updatedParticipant = getState()['features/lobby'].knockingParticipants.find(p => p.id === id);
    const { disableThirdPartyRequests } = getState()['features/base/config'];

    if (!disableThirdPartyRequests && updatedParticipant && !updatedParticipant.loadableAvatarUrl) {
        getFirstLoadableAvatarUrl(updatedParticipant, store).then(result => {
            if (result) {
                const { isUsingCORS, src } = result;

                dispatch(
                    participantIsKnockingOrUpdated({
                        loadableAvatarUrl: src,
                        id,
                        isUsingCORS
                    })
                );
            }
        });
    }
}

/**
 * Check the endpoint message that arrived through the conference and
 * sends a lobby notification, if the message belongs to the feature.
 *
 * @param {Object} origin - The origin (initiator) of the message.
 * @param {Object} message - The actual message.
 * @param {Object} store - The Redux store.
 * @returns {void}
 */
function _maybeSendLobbyNotification(origin, message, { dispatch, getState }) {
    if (!origin?._id || message?.type !== 'lobby-notify') {
        return;
    }

    const notificationProps: any = {
        descriptionArguments: {
            originParticipantName: getParticipantDisplayName(getState, origin._id),
            targetParticipantName: message.name
        },
        titleKey: 'lobby.notificationTitle'
    };

    switch (message.event) {
    case 'LOBBY-ENABLED':
        notificationProps.descriptionKey = `lobby.notificationLobby${message.value ? 'En' : 'Dis'}abled`;
        break;
    case 'LOBBY-ACCESS-GRANTED':
        notificationProps.descriptionKey = 'lobby.notificationLobbyAccessGranted';
        break;
    case 'LOBBY-ACCESS-DENIED':
        notificationProps.descriptionKey = 'lobby.notificationLobbyAccessDenied';
        break;
    }

    dispatch(
        showNotification(
            notificationProps,
            isTestModeEnabled(getState()) ? NOTIFICATION_TIMEOUT_TYPE.STICKY : NOTIFICATION_TIMEOUT_TYPE.MEDIUM
        )
    );
}
