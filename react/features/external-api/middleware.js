// @flow

import { CONFERENCE_FAILED, CONFERENCE_JOINED } from '../base/conference';
import { NOTIFY_CAMERA_ERROR, NOTIFY_MIC_ERROR } from '../base/devices';
import { JitsiConferenceErrors } from '../base/lib-jitsi-meet';
import {
    getAvatarURLByParticipantId,
    getLocalParticipant
} from '../base/participants';
import { MiddlewareRegistry } from '../base/redux';
import { appendSuffix } from '../display-name';
import { SUBMIT_FEEDBACK } from '../feedback';
import { SET_FILMSTRIP_VISIBLE } from '../filmstrip';

declare var APP: Object;
declare var interfaceConfig: Object;

/**
 * The middleware of the feature {@code external-api}.
 *
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    const result = next(action);

    switch (action.type) {
    case CONFERENCE_FAILED: {
        if (action.conference
            && action.error.name === JitsiConferenceErrors.PASSWORD_REQUIRED) {
            APP.API.notifyOnPasswordRequired();
        }
        break;
    }

    case CONFERENCE_JOINED: {
        const state = store.getState();
        const { room } = state['features/base/conference'];
        const { name, id } = getLocalParticipant(state);

        APP.API.notifyConferenceJoined(
            room,
            id,
            {
                displayName: name,
                formattedDisplayName: appendSuffix(
                    name,
                    interfaceConfig.DEFAULT_LOCAL_DISPLAY_NAME
                ),
                avatarURL: getAvatarURLByParticipantId(state, id)
            }
        );

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

    case SET_FILMSTRIP_VISIBLE:
        APP.API.notifyFilmstripDisplayChanged(action.visible);
        break;

    case SUBMIT_FEEDBACK:
        APP.API.notifyFeedbackSubmitted();
        break;
    }

    return result;
});
