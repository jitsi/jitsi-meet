import { getName } from '../app';
import { translateToHTML } from '../base/i18n';
import { browser } from '../base/lib-jitsi-meet';
import { showWarningNotification } from '../notifications';

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
