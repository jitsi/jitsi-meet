import i18n from 'i18next';
import { batch } from 'react-redux';
import { AnyAction } from 'redux';

import { IStore } from '../app/types';
import { APP_WILL_MOUNT, APP_WILL_UNMOUNT } from '../base/app/actionTypes';
import {
    CONFERENCE_FAILED,
    CONFERENCE_JOINED
} from '../base/conference/actionTypes';
import { conferenceWillJoin } from '../base/conference/actions';
import {
    JitsiConferenceErrors,
    JitsiConferenceEvents
} from '../base/lib-jitsi-meet';
import {
    getFirstLoadableAvatarUrl,
    getParticipantDisplayName
} from '../base/participants/functions';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import StateListenerRegistry from '../base/redux/StateListenerRegistry';
import {
    playSound,
    registerSound,
    unregisterSound
} from '../base/sounds/actions';
import { isTestModeEnabled } from '../base/testing/functions';
import { BUTTON_TYPES } from '../base/ui/constants.any';
import { openChat } from '../chat/actions';
import {
    handleLobbyChatInitialized,
    removeLobbyChatParticipant
} from '../chat/actions.any';
import { hideNotification, showNotification } from '../notifications/actions';
import {
    LOBBY_NOTIFICATION_ID,
    NOTIFICATION_ICON,
    NOTIFICATION_TIMEOUT_TYPE,
    NOTIFICATION_TYPE
} from '../notifications/constants';
import { INotificationProps } from '../notifications/types';
import { open as openParticipantsPane } from '../participants-pane/actions';
import { getParticipantsPaneOpen } from '../participants-pane/functions';
import { isPrejoinPageVisible, shouldAutoKnock } from '../prejoin/functions';

import {
    KNOCKING_PARTICIPANT_ARRIVED_OR_UPDATED,
    KNOCKING_PARTICIPANT_LEFT
} from './actionTypes';
import {
    approveKnockingParticipant,
    hideLobbyScreen,
    knockingParticipantLeft,
    openLobbyScreen,
    participantIsKnockingOrUpdated,
    rejectKnockingParticipant,
    setLobbyMessageListener,
    setLobbyModeEnabled,
    setPasswordJoinFailed,
    startKnocking
} from './actions';
import { updateLobbyParticipantOnLeave } from './actions.any';
import { KNOCKING_PARTICIPANT_SOUND_ID } from './constants';
import { getKnockingParticipants, showLobbyChatButton } from './functions';
import { KNOCKING_PARTICIPANT_FILE } from './sounds';
import { IKnockingParticipant } from './types';


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
            conference.on(JitsiConferenceEvents.MEMBERS_ONLY_CHANGED, (enabled: boolean) => {
                dispatch(setLobbyModeEnabled(enabled));
                if (enabled) {
                    dispatch(setLobbyMessageListener());
                }
            });

            conference.on(JitsiConferenceEvents.LOBBY_USER_JOINED, (id: string, name: string) => {
                const { soundsParticipantKnocking } = getState()['features/base/settings'];

                batch(() => {
                    dispatch(
                        participantIsKnockingOrUpdated({
                            id,
                            name
                        })
                    );
                    if (soundsParticipantKnocking) {
                        dispatch(playSound(KNOCKING_PARTICIPANT_SOUND_ID));
                    }

                    const isParticipantsPaneVisible = getParticipantsPaneOpen(getState());

                    if (typeof APP !== 'undefined') {
                        APP.API.notifyKnockingParticipant({
                            id,
                            name
                        });
                    }

                    if (isParticipantsPaneVisible || navigator.product === 'ReactNative') {
                        return;
                    }

                    _handleLobbyNotification({
                        dispatch,
                        getState
                    });
                });
            });

            conference.on(JitsiConferenceEvents.LOBBY_USER_UPDATED, (id: string, participant: IKnockingParticipant) => {
                dispatch(
                    participantIsKnockingOrUpdated({
                        ...participant,
                        id
                    })
                );
            });

            conference.on(JitsiConferenceEvents.LOBBY_USER_LEFT, (id: string) => {
                batch(() => {
                    dispatch(knockingParticipantLeft(id));
                    dispatch(removeLobbyChatParticipant());
                    dispatch(updateLobbyParticipantOnLeave(id));
                });
            });

            conference.on(JitsiConferenceEvents.ENDPOINT_MESSAGE_RECEIVED, (origin: any, sender: any) =>
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
function _handleLobbyNotification(store: IStore) {
    const { dispatch, getState } = store;
    const knockingParticipants = getKnockingParticipants(getState());

    if (knockingParticipants.length === 0) {
        dispatch(hideNotification(LOBBY_NOTIFICATION_ID));

        return;
    }

    let notificationTitle;
    let customActionNameKey;
    let customActionHandler;
    let customActionType;
    let descriptionKey;
    let icon;

    if (knockingParticipants.length === 1) {
        const firstParticipant = knockingParticipants[0];
        const { disablePolls } = getState()['features/base/config'];
        const showChat = showLobbyChatButton(firstParticipant)(getState());

        descriptionKey = 'notify.participantWantsToJoin';
        notificationTitle = firstParticipant.name;
        icon = NOTIFICATION_ICON.PARTICIPANT;
        customActionNameKey = [ 'lobby.admit', 'lobby.reject' ];
        customActionType = [ BUTTON_TYPES.PRIMARY, BUTTON_TYPES.DESTRUCTIVE ];
        customActionHandler = [ () => batch(() => {
            dispatch(hideNotification(LOBBY_NOTIFICATION_ID));
            dispatch(approveKnockingParticipant(firstParticipant.id));
        }),
        () => batch(() => {
            dispatch(hideNotification(LOBBY_NOTIFICATION_ID));
            dispatch(rejectKnockingParticipant(firstParticipant.id));
        }) ];

        // This checks if lobby chat button is available
        // and, if so, it adds it to the customActionNameKey array
        if (showChat) {
            customActionNameKey.splice(1, 0, 'lobby.chat');
            customActionType.splice(1, 0, BUTTON_TYPES.SECONDARY);
            customActionHandler.splice(1, 0, () => batch(() => {
                dispatch(handleLobbyChatInitialized(firstParticipant.id));
                dispatch(openChat({}, disablePolls));
            }));
        }
    } else {
        descriptionKey = 'notify.participantsWantToJoin';
        notificationTitle = i18n.t('notify.waitingParticipants', {
            waitingParticipants: knockingParticipants.length
        });
        icon = NOTIFICATION_ICON.PARTICIPANTS;
        customActionNameKey = [ 'notify.viewLobby' ];
        customActionType = [ BUTTON_TYPES.PRIMARY ];
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
        customActionType,
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
function _conferenceFailed({ dispatch, getState }: IStore, next: Function, action: AnyAction) {
    const { error } = action;
    const state = getState();
    const { membersOnly } = state['features/base/conference'];
    const nonFirstFailure = Boolean(membersOnly);
    const { isDisplayNameRequiredError } = state['features/lobby'];
    const { prejoinConfig } = state['features/base/config'];

    if (error.name === JitsiConferenceErrors.MEMBERS_ONLY_ERROR) {
        if (typeof error.recoverable === 'undefined') {
            error.recoverable = true;
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [ _lobbyJid, lobbyWaitingForHost ] = error.params;

        const result = next(action);

        dispatch(openLobbyScreen());

        // if there was an error about display name and pre-join is not enabled
        if (shouldAutoKnock(state) || (isDisplayNameRequiredError && !prejoinConfig?.enabled) || lobbyWaitingForHost) {
            dispatch(startKnocking());
        }

        // In case of wrong password we need to be in the right state if in the meantime someone allows us to join
        if (nonFirstFailure) {
            dispatch(conferenceWillJoin(membersOnly));
        }

        dispatch(setPasswordJoinFailed(nonFirstFailure));

        return result;
    } else if (error.name === JitsiConferenceErrors.DISPLAY_NAME_REQUIRED) {
        const [ isLobbyEnabled ] = error.params;

        const result = next(action);

        // if the error is due to required display name because lobby is enabled for the room
        // if not showing the prejoin page then show lobby UI
        if (isLobbyEnabled && !isPrejoinPageVisible(state)) {
            dispatch(openLobbyScreen());
        }

        return result;
    }

    dispatch(hideLobbyScreen());

    if (error.name === JitsiConferenceErrors.CONFERENCE_ACCESS_DENIED) {
        dispatch(
            showNotification({
                appearance: NOTIFICATION_TYPE.ERROR,
                hideErrorSupportLink: true,
                titleKey: 'lobby.joinRejectedTitle',
                descriptionKey: 'lobby.joinRejectedMessage'
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
function _conferenceJoined({ dispatch }: IStore, next: Function, action: AnyAction) {
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
function _findLoadableAvatarForKnockingParticipant(store: IStore, { id }: { id: string; }) {
    const { dispatch, getState } = store;
    const updatedParticipant = getState()['features/lobby'].knockingParticipants.find(p => p.id === id);
    const { disableThirdPartyRequests } = getState()['features/base/config'];

    if (!disableThirdPartyRequests && updatedParticipant && !updatedParticipant.loadableAvatarUrl) {
        getFirstLoadableAvatarUrl(updatedParticipant, store).then((result: { isUsingCORS: boolean; src: string; }) => {
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
function _maybeSendLobbyNotification(origin: any, message: any, { dispatch, getState }: IStore) {
    if (!origin?._id || message?.type !== 'lobby-notify') {
        return;
    }

    const notificationProps: INotificationProps = {
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
