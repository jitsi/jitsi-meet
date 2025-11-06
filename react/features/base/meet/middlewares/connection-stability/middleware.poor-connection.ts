import { AnyAction } from 'redux';
import { IStore } from '../../../../app/types';
import { showNotification, hideNotification } from '../../../../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE } from '../../../../notifications/constants';
import { CONFERENCE_JOINED, CONFERENCE_WILL_LEAVE } from '../../../conference/actionTypes';
import { getLocalParticipant } from '../../../participants/functions';
import MiddlewareRegistry from '../../../redux/MiddlewareRegistry';
import statsEmitter from '../../../../connection-indicator/statsEmitter';

const POOR_CONNECTION_NOTIFICATION_ID = 'connection.poor';
const GOOD_CONNECTION_THRESHOLD = 30;
const MIN_TIME_BETWEEN_WARNINGS_MS = 60000;

let conferenceJoinTime: number | null = null;
let lastWarningTime: number | null = null;
let isNotificationCurrentlyShown = false;
let isSubscribedToStats = false;

interface IConnectionStats {
    connectionQuality?: number;
    bandwidth?: {
        download?: number;
        upload?: number;
    };
    bitrate?: {
        download?: number;
        upload?: number;
    };
}

const showPoorConnectionWarning = (store: IStore) => {
    const now = Date.now();

    if (lastWarningTime && (now - lastWarningTime) < MIN_TIME_BETWEEN_WARNINGS_MS) {
        return;
    }

    store.dispatch(
        showNotification(
            {
                titleKey: 'notify.poorConnection',
                descriptionKey: 'notify.poorConnectionDescription',
                uid: POOR_CONNECTION_NOTIFICATION_ID,
            },
            NOTIFICATION_TIMEOUT_TYPE.LONG
        )
    );

    lastWarningTime = now;
    isNotificationCurrentlyShown = true;
};

const hidePoorConnectionWarning = (store: IStore) => {
    if (!isNotificationCurrentlyShown) {
        return;
    }

    store.dispatch(hideNotification(POOR_CONNECTION_NOTIFICATION_ID));
    isNotificationCurrentlyShown = false;
};

const checkConnectionQuality = (store: IStore, connectionQuality: number) => {
    if (!conferenceJoinTime) {
        return;
    }

    if (connectionQuality < GOOD_CONNECTION_THRESHOLD) {
        showPoorConnectionWarning(store);
    } else {
        hidePoorConnectionWarning(store);
    }
};

const onStatsUpdated = (store: IStore) => (stats: IConnectionStats) => {
    if (!conferenceJoinTime) {
        return;
    }

    const connectionQuality = stats.connectionQuality;

    if (typeof connectionQuality === 'number') {
        checkConnectionQuality(store, connectionQuality);
    }
};

MiddlewareRegistry.register((store: IStore) => (next) => (action: AnyAction) => {
    const result = next(action);

    switch (action.type) {
        case CONFERENCE_JOINED: {
            const state = store.getState();
            const localParticipant = getLocalParticipant(state);

            if (!localParticipant) {
                break;
            }

            conferenceJoinTime = Date.now();
            lastWarningTime = null;
            isNotificationCurrentlyShown = false;

            if (localParticipant.id && !isSubscribedToStats) {
                statsEmitter.subscribeToClientStats(localParticipant.id, onStatsUpdated(store));
                isSubscribedToStats = true;
            }

            break;
        }

        case CONFERENCE_WILL_LEAVE: {
            // User manually hung up - hide notification and reset state
            hidePoorConnectionWarning(store);
            conferenceJoinTime = null;
            lastWarningTime = null;
            isNotificationCurrentlyShown = false;
            break;
        }
    }

    return result;
});

export default {};
