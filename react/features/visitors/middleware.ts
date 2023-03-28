import { CONFERENCE_JOIN_IN_PROGRESS } from '../base/conference/actionTypes';
import { JitsiConferenceEvents } from '../base/lib-jitsi-meet';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';

import { updateVisitorsCount } from './actions';

MiddlewareRegistry.register(({ dispatch, getState }) => next => action => {
    if (action.type === CONFERENCE_JOIN_IN_PROGRESS) {
        const { conference } = action;

        conference.on(JitsiConferenceEvents.PROPERTIES_CHANGED, (properties: { 'visitor-count': number; }) => {
            const visitorCount = Number(properties?.['visitor-count']);

            if (!isNaN(visitorCount) && getState()['features/visitors'].count !== visitorCount) {
                dispatch(updateVisitorsCount(visitorCount));
            }
        });
    }

    return next(action);
});
