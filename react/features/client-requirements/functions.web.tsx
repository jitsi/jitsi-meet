import React from 'react';

import { INotificationProps } from '../notifications/types';

/**
 * Builds the description of a notification about missing capabilities. The link is rendered around a part of the
 * text, so that no URL is shown to the user.
 *
 * @param {string} text - The text which describes the missing capabilities.
 * @param {string|undefined} url - A URL with more information, if the server sent one.
 * @param {Function} t - The translation function.
 * @returns {Object} The description properties of the notification.
 */
export function getDescriptionProps(text: string, url: string | undefined, t: Function): INotificationProps {
    if (!url) {
        return { description: text };
    }

    return {
        description: (
            <span>
                { `${text} ` }
                <a
                    href = { url }
                    rel = 'noopener noreferrer'
                    target = '_blank'>
                    { t('clientRequirements.seeDetails') }
                </a>
            </span>
        )
    };
}
