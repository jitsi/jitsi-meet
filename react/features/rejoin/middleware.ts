import { createRejoinedEvent } from '../analytics/AnalyticsEvents';
import { sendAnalytics } from '../analytics/functions';
import StateListenerRegistry from '../base/redux/StateListenerRegistry';

StateListenerRegistry.register(
    /* selector */ state => {
        const recentList = state['features/recent-list'];

        // Return the most recent conference entry
        return recentList?.length && recentList[recentList.length - 1];
    },
    // eslint-disable-next-line no-empty-pattern
    /* listener */ (newMostRecent, { }, prevMostRecent) => {
        if (prevMostRecent && newMostRecent) {

            // Send the rejoined event just before the duration is reset on the most recent entry
            if (prevMostRecent.conference === newMostRecent.conference && newMostRecent.duration === 0) {
                sendAnalytics(
                    createRejoinedEvent({
                        lastConferenceDuration: prevMostRecent.duration / 1000,
                        timeSinceLeft: (Date.now() - (prevMostRecent.date + prevMostRecent.duration)) / 1000,
                        url: prevMostRecent.conference
                    })
                );
            }
        }
    });
