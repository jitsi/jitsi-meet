// @flow

import { CONFERENCE_FAILED } from '../base/conference';
import { NOTIFY_CAMERA_ERROR, NOTIFY_MIC_ERROR } from '../base/devices';
import { JitsiConferenceErrors } from '../base/lib-jitsi-meet';
import { MiddlewareRegistry } from '../base/redux';

declare var APP: Object;

/**
 * The middleware of the feature {@code external-api}.
 *
 * @returns {Function}
 */
MiddlewareRegistry.register((/* store */) => next => action => {
    switch (action.type) {
    case CONFERENCE_FAILED: {
        if (action.conference
            && action.error.name === JitsiConferenceErrors.PASSWORD_REQUIRED) {
            APP.API.notifyOnPasswordRequired();
        }
        break;
    }

    case NOTIFY_CAMERA_ERROR:
        if (action.error) {
            APP.API.notifyOnCameraError(
              action.error.name, action.error.message);
        }
        break;

    case NOTIFY_MIC_ERROR:
        if (action.error) {
            APP.API.notifyOnMicError(action.error.name, action.error.message);
        }
        break;
    }

    return next(action);
});
