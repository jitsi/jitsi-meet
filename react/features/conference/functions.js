import { translateToHTML } from '../base/i18n';
import { browser } from '../base/lib-jitsi-meet';
import { toState } from '../base/redux';

import { getName } from '../app';
import {
    areThereNotifications,
    showWarningNotification
} from '../notifications';
import { getOverlayToRender } from '../overlay';

/**
 * Shows the suboptimal experience notification if needed.
 *
 * @param {Function} dispatch - The dispatch method.
 * @param {Function} t - The translation function.
 * @returns {void}
 */
export function maybeShowSuboptimalExperienceNotification(dispatch, t) {
    if (!browser.isChrome()
            && !browser.isFirefox()
            && !browser.isNWJS()
            && !browser.isElectron()
            && !(browser.isSafariWithVP8() && browser.usesPlanB())

            // Adding react native to the list of recommended browsers is not
            // necessary for now because the function won't be executed at all
            // in this case but I'm adding it for completeness.
            && !browser.isReactNative()
    ) {
        dispatch(
            showWarningNotification(
                {
                    titleKey: 'notify.suboptimalExperienceTitle',
                    description: translateToHTML(
                        t,
                        'notify.suboptimalExperienceDescription',
                        {
                            appName: getName()
                        })
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
