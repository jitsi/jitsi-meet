import { getAudioOutputDeviceId } from '../devices/functions.web';
import MiddlewareRegistry from '../redux/MiddlewareRegistry';

import { _ADD_AUDIO_ELEMENT } from './actionTypes';

import './middleware.any';

/**
 * Implements the entry point of the middleware of the feature base/sounds.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(_store => next => action => {

    switch (action.type) {
    case _ADD_AUDIO_ELEMENT:
        action.audioElement?.setSinkId?.(getAudioOutputDeviceId());
        break;
    }

    return next(action);
});
