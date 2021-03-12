import { getName } from '../app/functions.web';
import { isSuboptimalBrowser } from '../base/environment';
import { translateToHTML } from '../base/i18n';
import { getLocalParticipant } from '../base/participants';
import { toState } from '../base/redux';
import { getBackendSafePath, getJitsiMeetGlobalNS } from '../base/util';
import { getVpaasBillingId } from '../billing-counter/functions';
import { showWarningNotification } from '../notifications';
import { createRnnoiseProcessor } from '../stream-effects/rnnoise';

export * from './functions.any';

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

    if (locationURL) {
        options.confID = `${locationURL.host}${getBackendSafePath(locationURL.pathname)}`;
    }

    options.applicationName = getName();
    options.getWiFiStatsMethod = getWiFiStatsMethod;
    options.createVADProcessor = createRnnoiseProcessor;
    options.billingId = getVpaasBillingId(state);

    // Disable CallStats, if requessted.
    if (options.disableThirdPartyRequests) {
        delete options.callStatsID;
        delete options.callStatsSecret;
        delete options.getWiFiStatsMethod;
    }

    return options;
}
