import { MEDIA_TYPE, setVideoMuted, VIDEO_MUTISM_AUTHORITY } from '../base/media';
import { MiddlewareRegistry } from '../base/redux';
import { CLIENT_RESIZED } from '../base/responsive-ui';
import { setLargeVideoDimensions } from '../large-video/actions.any';

import { SET_CAR_MODE } from './actionTypes';
import './middleware.any';

/**
 * Middleware which intercepts actions and updates the legacy component.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    const result = next(action);
    const { dispatch } = store;

    switch (action.type) {
    case SET_CAR_MODE:
        dispatch(setVideoMuted(action.enabled, MEDIA_TYPE.VIDEO, VIDEO_MUTISM_AUTHORITY.CAR_MODE));
        break;
    case CLIENT_RESIZED: {
        const { clientHeight, clientWidth } = store.getState()['features/base/responsive-ui'];

        // On mobile the large video should always fill the screen.
        dispatch(setLargeVideoDimensions(clientHeight, clientWidth));
        break;
    }
    }

    return result;
});
