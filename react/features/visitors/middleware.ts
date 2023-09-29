import { CONFERENCE_JOINED, CONFERENCE_JOIN_IN_PROGRESS } from '../base/conference/actionTypes';
import { JitsiConferenceEvents } from '../base/lib-jitsi-meet';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import { showNotification } from '../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE } from '../notifications/constants';

import { updateVisitorsCount } from './actions';

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
        if (getState()['features/visitors'].iAmVisitor) {
            dispatch(showNotification({
                titleKey: 'visitors.notification.title',
                descriptionKey: 'visitors.notification.description'
            }, NOTIFICATION_TIMEOUT_TYPE.STICKY));
        }
        break;
    }
    }

    return next(action);
});
