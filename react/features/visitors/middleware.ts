import { CONFERENCE_JOINED, CONFERENCE_JOIN_IN_PROGRESS } from '../base/conference/actionTypes';
import { JitsiConferenceEvents } from '../base/lib-jitsi-meet';
import { raiseHand } from '../base/participants/actions';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import { showNotification } from '../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE } from '../notifications/constants';

import { clearPromotionRequest, promotionRequestReceived, updateVisitorsCount } from './actions';
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
