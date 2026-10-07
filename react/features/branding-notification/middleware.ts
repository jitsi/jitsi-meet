import { jitsiLocalStorage } from '@jitsi/js-utils';

import { CONFERENCE_JOINED } from '../base/conference/actionTypes';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import { BUTTON_TYPES } from '../base/ui/constants.any';
import { openURLInBrowser } from '../base/util/openURLInBrowser';
import { showNotification } from '../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE } from '../notifications/constants';

import { BRANDING_NOTIFICATION_HIDDEN, BRANDING_NOTIFICATION_ID } from './constants';
import { BRANDING_NOTIFICATION } from './extraConstants';

/**
 * Middleware that shows the deploy-specific notification when the user joins a conference, until the user chooses not
 * to see it again.
 *
 * @param {IStore} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(({ dispatch }) => next => action => {
    const result = next(action);

    switch (action.type) {
    case CONFERENCE_JOINED: {
        if (!BRANDING_NOTIFICATION
                || jitsiLocalStorage.getItem(BRANDING_NOTIFICATION_HIDDEN) === BRANDING_NOTIFICATION.id) {
            break;
        }

        const { actionKey, descriptionKey, dontShowAgainKey, id, titleKey, url } = BRANDING_NOTIFICATION;

        dispatch(showNotification({
            customActionHandler: [
                () => {
                    openURLInBrowser(url, true);

                    return true;
                },
                () => {
                    jitsiLocalStorage.setItem(BRANDING_NOTIFICATION_HIDDEN, id);

                    return true;
                }
            ],
            customActionNameKey: [ actionKey, dontShowAgainKey ],
            customActionType: [ BUTTON_TYPES.PRIMARY, BUTTON_TYPES.TERTIARY ],
            descriptionKey,
            titleKey,
            uid: BRANDING_NOTIFICATION_ID
        }, NOTIFICATION_TIMEOUT_TYPE.STICKY));

        break;
    }
    }

    return result;
});
