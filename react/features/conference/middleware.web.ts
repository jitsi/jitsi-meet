
import { CONFERENCE_JOINED } from '../base/conference/actionTypes';
import { IJitsiConference } from '../base/conference/reducer';
import { JitsiConferenceEvents } from '../base/lib-jitsi-meet';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import { openAllowToggleCameraDialog, setCameraFacingMode } from '../base/tracks/actions.web';
import { CAMERA_FACING_MODE_MESSAGE } from '../base/tracks/constants';

import './middleware.any';

MiddlewareRegistry.register(_store => next => action => {
    switch (action.type) {
    case CONFERENCE_JOINED: {
        _addSetCameraFacingModeListener(action.conference);
        break;
    }
    }

    return next(action);
});

/**
 * Registers listener for {@link JitsiConferenceEvents.ENDPOINT_MESSAGE_RECEIVED} that
 * will perform various chat related activities.
 *
 * @param {IJitsiConference} conference - The conference.
 * @returns {void}
 */
function _addSetCameraFacingModeListener(conference: IJitsiConference) {
    conference.on(
        JitsiConferenceEvents.ENDPOINT_MESSAGE_RECEIVED,
        (...args: any) => {
            if (args && args.length >= 2) {
                const [ sender, eventData ] = args;

                if (eventData.name === CAMERA_FACING_MODE_MESSAGE) {
                    APP.store.dispatch(openAllowToggleCameraDialog(
                        /* onAllow */ () => APP.store.dispatch(setCameraFacingMode(eventData.facingMode)),
                        /* initiatorId */ sender._id
                    ));
                }
            }
        }
    );
}
