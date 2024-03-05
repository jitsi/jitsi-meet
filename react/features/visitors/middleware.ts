import i18n from 'i18next';
import { batch } from 'react-redux';

import { IStore } from '../app/types';
import {
    CONFERENCE_JOINED,
    CONFERENCE_JOIN_IN_PROGRESS,
    ENDPOINT_MESSAGE_RECEIVED
} from '../base/conference/actionTypes';
import { connect, setPreferVisitor } from '../base/connection/actions';
import { disconnect } from '../base/connection/actions.any';
import { JitsiConferenceEvents } from '../base/lib-jitsi-meet';
import { raiseHand } from '../base/participants/actions';
import { getLocalParticipant, getParticipantById } from '../base/participants/functions';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import { BUTTON_TYPES } from '../base/ui/constants.any';
import { hideNotification, showNotification } from '../notifications/actions';
import {
    NOTIFICATION_ICON,
    NOTIFICATION_TIMEOUT_TYPE,
    VISITORS_PROMOTION_NOTIFICATION_ID
} from '../notifications/constants';
import { INotificationProps } from '../notifications/types';
import { open as openParticipantsPane } from '../participants-pane/actions';

import {
    approveRequest,
    clearPromotionRequest,
    denyRequest,
    promotionRequestReceived,
    setVisitorDemoteActor,
    setVisitorsSupported,
    updateVisitorsCount
} from './actions';
import { getPromotionRequests } from './functions';
import logger from './logger';

MiddlewareRegistry.register(({ dispatch, getState }) => next => action => {
    switch (action.type) {
    case CONFERENCE_JOIN_IN_PROGRESS: {
        const { conference } = action;

        conference.on(JitsiConferenceEvents.PROPERTIES_CHANGED, (properties: { 'visitor-count': number; }) => {
            const visitorCount = Number(properties?.['visitor-count']);

            if (!isNaN(visitorCount) && getState()['features/visitors'].count !== visitorCount) {
                dispatch(updateVisitorsCount(visitorCount));
            }
        });
        break;
    }
    case CONFERENCE_JOINED: {
        const { conference } = action;

        if (getState()['features/visitors'].iAmVisitor) {
            const { demoteActorDisplayName } = getState()['features/visitors'];

            dispatch(setVisitorDemoteActor(undefined));

            const notificationParams: INotificationProps = {
                titleKey: 'visitors.notification.title',
                descriptionKey: 'visitors.notification.description'
            };

            if (demoteActorDisplayName) {
                notificationParams.descriptionKey = 'visitors.notification.demoteDescription';
                notificationParams.descriptionArguments = {
                    actor: demoteActorDisplayName
                };
            }

            // check for demote actor and update notification
            dispatch(showNotification(notificationParams, NOTIFICATION_TIMEOUT_TYPE.STICKY));
        } else {
            dispatch(setVisitorsSupported(conference.isVisitorsSupported()));
            conference.on(JitsiConferenceEvents.VISITORS_SUPPORTED_CHANGED, (value: boolean) => {
                dispatch(setVisitorsSupported(value));
            });
        }

        conference.on(JitsiConferenceEvents.VISITORS_MESSAGE, (
                msg: { action: string; actor: string; from: string; id: string; nick: string; on: boolean; }) => {

            if (msg.action === 'demote-request') {
                // we need it before the disconnect
                const participantById = getParticipantById(getState, msg.actor);
                const localParticipant = getLocalParticipant(getState);

                if (localParticipant && localParticipant.id === msg.id) {
                    // handle demote
                    dispatch(disconnect(true))
                        .then(() => dispatch(setPreferVisitor(true)))
                        .then(() => {
                            // we need to set the name, so we can use it later in the notification
                            if (participantById) {
                                dispatch(setVisitorDemoteActor(participantById.name));
                            }

                            return dispatch(connect());
                        });
                }
            } else if (msg.action === 'promotion-request') {
                const request = {
                    from: msg.from,
                    nick: msg.nick
                };

                if (msg.on) {
                    dispatch(promotionRequestReceived(request));
                } else {
                    dispatch(clearPromotionRequest(request));
                }
                _handlePromotionNotification({
                    dispatch,
                    getState
                });
            } else {
                logger.error('Unknown action:', msg.action);
            }
        });

        conference.on(JitsiConferenceEvents.VISITORS_REJECTION, () => {
            dispatch(raiseHand(false));
        });

        break;
    }
    case ENDPOINT_MESSAGE_RECEIVED: {
        const { data } = action;

        if (data?.action === 'promotion-response' && data.approved) {
            const request = getPromotionRequests(getState())
                .find(r => r.from === data.id);

            request && dispatch(clearPromotionRequest(request));
        }
        break;
    }
    }

    return next(action);
});

/**
 * Function to handle the promotion notification.
 *
 * @param {Object} store - The Redux store.
 * @returns {void}
 */
function _handlePromotionNotification(
        { dispatch, getState }: { dispatch: IStore['dispatch']; getState: IStore['getState']; }) {
    const requests = getPromotionRequests(getState());

    if (requests.length === 0) {
        dispatch(hideNotification(VISITORS_PROMOTION_NOTIFICATION_ID));

        return;
    }

    let notificationTitle;
    let customActionNameKey;
    let customActionHandler;
    let customActionType;
    let descriptionKey;
    let icon;

    if (requests.length === 1) {
        const firstRequest = requests[0];

        descriptionKey = 'notify.participantWantsToJoin';
        notificationTitle = firstRequest.nick;
        icon = NOTIFICATION_ICON.PARTICIPANT;
        customActionNameKey = [ 'participantsPane.actions.admit', 'participantsPane.actions.reject' ];
        customActionType = [ BUTTON_TYPES.PRIMARY, BUTTON_TYPES.DESTRUCTIVE ];
        customActionHandler = [ () => batch(() => {
            dispatch(hideNotification(VISITORS_PROMOTION_NOTIFICATION_ID));
            dispatch(approveRequest(firstRequest));
        }),
        () => batch(() => {
            dispatch(hideNotification(VISITORS_PROMOTION_NOTIFICATION_ID));
            dispatch(denyRequest(firstRequest));
        }) ];
    } else {
        descriptionKey = 'notify.participantsWantToJoin';
        notificationTitle = i18n.t('notify.waitingParticipants', {
            waitingParticipants: requests.length
        });
        icon = NOTIFICATION_ICON.PARTICIPANTS;
        customActionNameKey = [ 'notify.viewVisitors' ];
        customActionType = [ BUTTON_TYPES.PRIMARY ];
        customActionHandler = [ () => batch(() => {
            dispatch(hideNotification(VISITORS_PROMOTION_NOTIFICATION_ID));
            dispatch(openParticipantsPane());
        }) ];
    }

    dispatch(showNotification({
        title: notificationTitle,
        descriptionKey,
        uid: VISITORS_PROMOTION_NOTIFICATION_ID,
        customActionNameKey,
        customActionType,
        customActionHandler,
        icon
    }, NOTIFICATION_TIMEOUT_TYPE.STICKY));
}
