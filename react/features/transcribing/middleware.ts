import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import { showErrorNotification } from '../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE } from '../notifications/constants';

import { TRANSCRIBER_LEFT, TRANSCRIBER_JOINED } from './actionTypes';
import { startTranscription } from '../subtitles/actions.any';;
import './subscriber';
/**
 * Implements the middleware of the feature transcribing.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(({ dispatch }) => next => action => {
    switch (action.type) {  case TRANSCRIBER_JOINED: {
        const { transcriberJID, language } = action;

        if (language) {
            
            dispatch(startTranscription(language));
        }

        break;
    }
    case TRANSCRIBER_LEFT:
        if (action.abruptly) {
            dispatch(showErrorNotification({
                titleKey: 'transcribing.failed'
            }, NOTIFICATION_TIMEOUT_TYPE.LONG));
        }
        break;
    }

    return next(action);
});
