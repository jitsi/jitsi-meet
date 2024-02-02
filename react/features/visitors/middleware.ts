import i18n from 'i18next';
import { batch } from 'react-redux';

import { IStore } from '../app/types';
import { CONFERENCE_JOINED, CONFERENCE_JOIN_IN_PROGRESS } from '../base/conference/actionTypes';
import { JitsiConferenceEvents } from '../base/lib-jitsi-meet';
import { raiseHand } from '../base/participants/actions';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import { BUTTON_TYPES } from '../base/ui/constants.any';
import { hideNotification, showNotification } from '../notifications/actions';
import {
    NOTIFICATION_ICON,
    NOTIFICATION_TIMEOUT_TYPE,
    VISITORS_PROMOTION_NOTIFICATION_ID
} from '../notifications/constants';
import { open as openParticipantsPane } from '../participants-pane/actions';

import {
    approveRequest,
    clearPromotionRequest,
    denyRequest,
    promotionRequestReceived,
    updateVisitorsCount
} from './actions';
import { getPromotionRequests } from './functions';

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
            dispatch(showNotification({
                titleKey: 'visitors.notification.title',
                descriptionKey: 'visitors.notification.description'
            }, NOTIFICATION_TIMEOUT_TYPE.STICKY));
        }

        conference.on(JitsiConferenceEvents.VISITORS_MESSAGE, (
                msg: { from: string; nick: string; on: boolean; }) => {
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
        });

        conference.on(JitsiConferenceEvents.VISITORS_REJECTION, () => {
            dispatch(raiseHand(false));
        });

        conference.on(JitsiConferenceEvents.ENDPOINT_MESSAGE_RECEIVED,
            (user: any, data: any) => {
                if (data?.action === 'promotion-response' && data.approved) {
                    const request = getPromotionRequests(getState())
                        .find(r => r.from === data.id);

                    request && dispatch(clearPromotionRequest(request));
                }
            });

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
        customActionNameKey = [ 'notify.viewLobby' ];
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
