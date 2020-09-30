import { getName } from '../app/functions.web';
import { isSuboptimalBrowser } from '../base/environment';
import { translateToHTML } from '../base/i18n';
import { getLocalParticipant } from '../base/participants';
import { toState } from '../base/redux';
import { getBackendSafePath, getJitsiMeetGlobalNS } from '../base/util';
import {
    areThereNotifications,
    showWarningNotification
} from '../notifications';
import { getOverlayToRender } from '../overlay';
import { createRnnoiseProcessorPromise } from '../rnnoise';

/**
 * Returns the result of getWiFiStats from the global NS or does nothing
(returns empty result).
 * Fixes a concurrency problem where we need to pass a function when creating
 * a JitsiConference, but that method is added to the context later.
 *
 * @returns {Promise}
 * @private
 */
const getWiFiStatsMethod = () => {
    const gloabalNS = getJitsiMeetGlobalNS();

    return gloabalNS.getWiFiStats ? gloabalNS.getWiFiStats() : Promise.resolve('{}');
};

/**
 * Shows the suboptimal experience notification if needed.
 *
 * @param {Function} dispatch - The dispatch method.
 * @param {Function} t - The translation function.
 * @returns {void}
 */
export function maybeShowSuboptimalExperienceNotification(dispatch, t) {
    if (isSuboptimalBrowser()) {
        dispatch(
            showWarningNotification(
                {
                    titleKey: 'notify.suboptimalExperienceTitle',
                    description: translateToHTML(
                        t,
                        'notify.suboptimalBrowserWarning',
                        {
                            recommendedBrowserPageLink: `${window.location.origin}/static/recommendedBrowsers.html`
                        }
                    )
                }
            )
        );
    }
}

/**
 * Tells whether or not the notifications should be displayed within
 * the conference feature based on the current Redux state.
 *
 * @param {Object|Function} stateful - The redux store state.
 * @returns {boolean}
 */
export function shouldDisplayNotifications(stateful) {
    const state = toState(stateful);
    const isAnyOverlayVisible = Boolean(getOverlayToRender(state));
    const { calleeInfoVisible } = state['features/invite'];

    return areThereNotifications(state)
            && !isAnyOverlayVisible
            && !calleeInfoVisible;
}

/**
 * Returns an object aggregating the conference options.
 *
 * @param {Object|Function} stateful - The redux store state.
 * @returns {Object} - Options object.
 */
export function getConferenceOptions(stateful) {
    const state = toState(stateful);

    const options = state['features/base/config'];
    const { locationURL } = state['features/base/connection'];
    const { tenant } = state['features/base/jwt'];

    const { email, name: nick } = getLocalParticipant(state);

    if (tenant) {
        options.siteID = tenant;
    }

    if (options.enableDisplayNameInStats && nick) {
        options.statisticsDisplayName = nick;
    }

    if (options.enableEmailInStats && email) {
        options.statisticsId = email;
    }

    options.applicationName = getName();
    options.getWiFiStatsMethod = getWiFiStatsMethod;
    options.confID = `${locationURL.host}${getBackendSafePath(locationURL.pathname)}`;
    options.createVADProcessor = createRnnoiseProcessorPromise;

    // Disable CallStats, if requessted.
    if (options.disableThirdPartyRequests) {
        delete options.callStatsID;
        delete options.callStatsSecret;
        delete options.getWiFiStatsMethod;
    }

    return options;
}
