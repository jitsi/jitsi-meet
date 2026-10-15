import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { getSystemWideUserNotification, getTextKeys } from '../../functions';

/**
 * Shows the system-wide user notification on the welcome page.
 *
 * @returns {ReactElement|null}
 */
const WelcomePageNotification = () => {
    const { t } = useTranslation();
    const config = useSelector(getSystemWideUserNotification);

    if (!config?.url) {
        return null;
    }

    const { buttonKey, descriptionKey, titleKey } = getTextKeys(config);

    return (
        <div className = 'welcome-card welcome-card--notification'>
            { titleKey && <h3 className = 'welcome-notification-title'>{ t(titleKey) }</h3> }
            { descriptionKey && <p className = 'welcome-notification-description'>{ t(descriptionKey) }</p> }
            <a
                className = 'welcome-notification-link'
                href = { config.url }
                rel = 'noopener noreferrer'
                target = '_blank'>
                { t(buttonKey) }
            </a>
        </div>
    );
};

export default WelcomePageNotification;
