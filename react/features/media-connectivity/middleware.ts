import { IStore } from '../app/types';
import { getCurrentConference } from '../base/conference/functions';
import { IJitsiConference } from '../base/conference/reducer';
import { JitsiConferenceEvents, JitsiMediaConnectivityStatus } from '../base/lib-jitsi-meet';
import StateListenerRegistry from '../base/redux/StateListenerRegistry';
import { hideNotification, showNotification } from '../notifications/actions';
import {
    MEDIA_CONNECTIVITY_NOTIFICATION_ID,
    NOTIFICATION_TIMEOUT_TYPE,
    NOTIFICATION_TYPE
} from '../notifications/constants';

/**
 * How long a status has to last before it is notified, so that short drops and the switch from P2P to the bridge
 * don't flash a notification.
 */
const NOTIFICATION_DELAY = 5000;

const { AT_RISK, DEGRADED, FAILED, INTERRUPTED } = JitsiMediaConnectivityStatus;

/**
 * The notifications of the lib-jitsi-meet media connectivity statuses that are notified. Any other status, i.e.
 * good, clears the notification.
 */
const NOTIFICATIONS: Record<string, {
    appearance: string;
    descriptionKey: string;
    timeout: NOTIFICATION_TIMEOUT_TYPE;
    titleKey: string;
}> = {
    [AT_RISK]: {
        appearance: NOTIFICATION_TYPE.WARNING,
        descriptionKey: 'notify.mediaConnectivityAtRiskDescription',
        timeout: NOTIFICATION_TIMEOUT_TYPE.STICKY,
        titleKey: 'notify.mediaConnectivityAtRisk'
    },
    [DEGRADED]: {
        appearance: NOTIFICATION_TYPE.WARNING,
        descriptionKey: 'notify.mediaConnectivityDegradedDescription',
        timeout: NOTIFICATION_TIMEOUT_TYPE.LONG,
        titleKey: 'notify.mediaConnectivityDegraded'
    },
    [FAILED]: {
        appearance: NOTIFICATION_TYPE.ERROR,
        descriptionKey: 'notify.mediaConnectivityFailedDescription',
        timeout: NOTIFICATION_TIMEOUT_TYPE.STICKY,
        titleKey: 'notify.mediaConnectivityFailed'
    },
    [INTERRUPTED]: {
        appearance: NOTIFICATION_TYPE.WARNING,
        descriptionKey: 'notify.mediaConnectivityInterruptedDescription',
        timeout: NOTIFICATION_TIMEOUT_TYPE.STICKY,
        titleKey: 'notify.mediaConnectivityInterrupted'
    }
};

let delayTimeout: number | undefined;
let notifiedStatus: string | undefined;
let status: string | undefined;

StateListenerRegistry.register(
    state => getCurrentConference(state),
    (conference: IJitsiConference | undefined, store: IStore, previousConference?: IJitsiConference) => {
        if (previousConference) {
            _clear(store.dispatch);
        }

        // The recorder would show them in the recording and the live stream.
        if (store.getState()['features/base/config'].iAmRecorder) {
            return;
        }

        conference?.on(
            JitsiConferenceEvents.MEDIA_CONNECTIVITY_CHANGED,
            (connectivity: { status: string; }) => {
                if (getCurrentConference(store.getState()) === conference) {
                    _onStatusChanged(store, connectivity.status);
                }
            });
    });

/**
 * Cancels a pending notification and hides the shown one.
 *
 * @param {Function} dispatch - The redux dispatch function.
 * @returns {void}
 */
function _clear(dispatch: IStore['dispatch']) {
    window.clearTimeout(delayTimeout);
    delayTimeout = undefined;
    notifiedStatus && dispatch(hideNotification(MEDIA_CONNECTIVITY_NOTIFICATION_ID));
    notifiedStatus = undefined;
    status = undefined;
}

/**
 * Shows the notification of the current status, replacing the shown one.
 *
 * @param {Function} dispatch - The redux dispatch function.
 * @returns {void}
 */
function _notify(dispatch: IStore['dispatch']) {
    if (!status || status === notifiedStatus) {
        return;
    }

    const { timeout, ...props } = NOTIFICATIONS[status];
    const notification = dispatch(showNotification({
        ...props,
        uid: MEDIA_CONNECTIVITY_NOTIFICATION_ID
    }, timeout));

    // A disabled notification would leave the previous one showing a status that no longer applies.
    notification || dispatch(hideNotification(MEDIA_CONNECTIVITY_NOTIFICATION_ID));
    notifiedStatus = notification ? status : undefined;
}

/**
 * Notifies a status once it lasted {@link NOTIFICATION_DELAY}, then follows its changes right away while the
 * notification is shown.
 *
 * @param {Store} store - The redux store.
 * @param {string} newStatus - The media connectivity status of the active media session.
 * @returns {void}
 */
function _onStatusChanged({ dispatch, getState }: IStore, newStatus: string) {
    // Once the notification timed out or was dismissed, the next status has to last the delay again.
    if (notifiedStatus && !getState()['features/notifications'].notifications.some(
            n => n.uid === MEDIA_CONNECTIVITY_NOTIFICATION_ID)) {
        notifiedStatus = undefined;
    }

    const restored = (notifiedStatus === FAILED || notifiedStatus === INTERRUPTED)
        && (!NOTIFICATIONS[newStatus] || newStatus === DEGRADED);

    if (restored || !NOTIFICATIONS[newStatus]) {
        _clear(dispatch);
        restored && dispatch(showNotification({
            appearance: NOTIFICATION_TYPE.SUCCESS,
            titleKey: 'notify.mediaConnectivityRestored',
            uid: MEDIA_CONNECTIVITY_NOTIFICATION_ID
        }, NOTIFICATION_TIMEOUT_TYPE.SHORT));

        // Media coming back over TCP isn't followed by a limited connection, that would only confuse after the drop.
        status = restored && newStatus === DEGRADED ? newStatus : undefined;

        return;
    }

    const changed = newStatus !== status;

    status = newStatus;

    if (notifiedStatus) {
        _notify(dispatch);
    } else if (changed) {
        window.clearTimeout(delayTimeout);
        delayTimeout = window.setTimeout(() => {
            delayTimeout = undefined;
            _notify(dispatch);
        }, NOTIFICATION_DELAY);
    }
}
