import { BUTTON_TYPES } from '../base/ui/constants.native';
import { openURLInBrowser } from '../base/util/openURLInBrowser';
import { INotificationProps } from '../notifications/types';

/**
 * Builds the description of a notification about missing capabilities. A URL is shown as a button, because the native
 * notification renders text only, and we do not want to show a URL to the user.
 *
 * @param {string} text - The text which describes the missing capabilities.
 * @param {string|undefined} url - A URL with more information, if the server sent one.
 * @param {Function} _t - The translation function. Not needed here, the button uses a translation key.
 * @returns {Object} The description properties of the notification.
 */
export function getDescriptionProps(text: string, url: string | undefined, _t: Function): INotificationProps {
    if (!url) {
        return { description: text };
    }

    return {
        customActionHandler: [ () => {
            openURLInBrowser(url);

            return false;
        } ],
        customActionNameKey: [ 'clientRequirements.seeDetails' ],
        customActionType: [ BUTTON_TYPES.PRIMARY ],
        description: text
    };
}
