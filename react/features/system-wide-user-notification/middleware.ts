import { CONFERENCE_JOINED } from '../base/conference/actionTypes';
import { SET_CONFIG } from '../base/config/actionTypes';
import { I18NEXT_INITIALIZED, LANGUAGE_CHANGED } from '../base/i18n/actionTypes';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import { BUTTON_TYPES } from '../base/ui/constants.any';
import { openURLInBrowser } from '../base/util/openURLInBrowser';
import { showNotification } from '../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE } from '../notifications/constants';

import { SYSTEM_WIDE_USER_NOTIFICATION_ID } from './constants';
import {
    addLabelsToLanguageBundles,
    getSystemWideUserNotification,
    getTextKeys,
    hide,
    isHidden
} from './functions';

/**
 * Middleware that shows the system-wide user notification when the user joins a conference, until the user chooses
 * not to see it again.
 *
 * @param {IStore} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(({ dispatch, getState }) => next => action => {
    const result = next(action);

    switch (action.type) {
    case I18NEXT_INITIALIZED:
    case LANGUAGE_CHANGED:
    case SET_CONFIG: {
        // A language bundle which loads later replaces the labels, so they are added again when the language
        // changes.
        const config = getSystemWideUserNotification(getState());

        config && addLabelsToLanguageBundles(config);

        break;
    }
    case CONFERENCE_JOINED: {
        const config = getSystemWideUserNotification(getState());

        if (!config?.url || isHidden(config)) {
            break;
        }

        const { url } = config;
        const { buttonKey, descriptionKey, dontShowAgainKey, titleKey } = getTextKeys(config);

        dispatch(showNotification({
            customActionHandler: [
                () => {
                    openURLInBrowser(url, true);

                    return true;
                },
                () => {
                    hide(config);

                    return true;
                }
            ],
            customActionNameKey: [ buttonKey, dontShowAgainKey ],
            customActionType: [ BUTTON_TYPES.PRIMARY, BUTTON_TYPES.TERTIARY ],
            descriptionKey,
            titleKey,
            uid: SYSTEM_WIDE_USER_NOTIFICATION_ID
        }, NOTIFICATION_TIMEOUT_TYPE.STICKY));

        break;
    }
    }

    return result;
});
