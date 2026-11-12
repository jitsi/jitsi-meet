import React from 'react';
import { Trans } from 'react-i18next';

import { IStore } from '../app/types';
import { isSuboptimalBrowser } from '../base/environment/environment';
import { createTranslationLink } from '../base/i18n/functions';
import i18next from '../base/i18n/i18next';
import { showWarningNotification } from '../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE } from '../notifications/constants';

import { IFRAME_DISABLED_TIMEOUT_MINUTES } from './constants';

export * from './functions.any';

/**
 * Shows the suboptimal experience notification if needed.
 *
 * @param {Function} dispatch - The dispatch method.
 * @returns {void}
 */
export function maybeShowSuboptimalExperienceNotification(dispatch: IStore['dispatch']) {
    if (isSuboptimalBrowser()) {
        const recommendedBrowserPageLink = `${window.location.origin}/static/recommendedBrowsers.html`;

        dispatch(
            showWarningNotification(
                {
                    titleKey: 'notify.suboptimalExperienceTitle',
                    description: React.createElement(Trans, {
                        components: [ createTranslationLink(recommendedBrowserPageLink) ],
                        i18n: i18next,
                        i18nKey: 'notify.suboptimalBrowserWarning'
                    })
                }, NOTIFICATION_TIMEOUT_TYPE.LONG
            )
        );
    }
}

/**
 * Creates the description of the notification which tells the user that the meeting ends soon because embedding is
 * not allowed.
 *
 * @param {string} translationKey - The key of the text.
 * @param {string} domain - The domain of the deployment, if the text mentions it.
 * @param {string} jaasDomain - The URL of the service the text links to, if any.
 * @returns {ReactElement}
 */
export function getDisabledIframeDescription(translationKey: string, domain: string, jaasDomain?: string) {
    return React.createElement(Trans, {
        components: [ createTranslationLink(jaasDomain) ],
        i18n: i18next,
        i18nKey: translationKey,
        values: {
            domain,
            timeout: IFRAME_DISABLED_TIMEOUT_MINUTES
        }
    });
}
