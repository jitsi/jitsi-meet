import { JitsiConferenceEvents } from '../base/lib-jitsi-meet';
import StateListenerRegistry from '../base/redux/StateListenerRegistry';

import { updateVisitorsCount } from './actions';

StateListenerRegistry.register(
    state => state['features/base/conference'].conference,
    (conference, { dispatch, getState }, previousConference) => {
        if (conference && !previousConference) {
            conference.on(JitsiConferenceEvents.PROPERTIES_CHANGED, (properties: { 'visitor-count': number; }) => {
                const visitorCount = Number(properties?.['visitor-count']);

                if (!isNaN(visitorCount) && getState()['features/visitors'].count !== visitorCount) {
                    dispatch(updateVisitorsCount(visitorCount));
                }
            });
        }
    });

