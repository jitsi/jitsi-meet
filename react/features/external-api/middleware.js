// @flow

import {
    CONFERENCE_FAILED,
    CONFERENCE_JOINED,
    KICKED_OUT
} from '../base/conference';
import { NOTIFY_CAMERA_ERROR, NOTIFY_MIC_ERROR } from '../base/devices';
import { JitsiConferenceErrors } from '../base/lib-jitsi-meet';
import {
    PARTICIPANT_KICKED,
    SET_LOADABLE_AVATAR_URL,
    getAvatarURLByParticipantId,
    getLocalParticipant,
    getParticipantById
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
    // We need to do these before executing the rest of the middelware chain
    switch (action.type) {
    case SET_LOADABLE_AVATAR_URL: {
        const { id, loadableAvatarUrl } = action.participant;
        const participant = getParticipantById(
            store.getState(),
            id
        );

        const result = next(action);

        if (participant.loadableAvatarUrl !== loadableAvatarUrl) {
            APP.API.notifyAvatarChanged(
                id,
                loadableAvatarUrl
            );
        }

        return result;
    }
    }

    const result = next(action);

    // These should happen after the rest of the middleware chain ran
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

    case KICKED_OUT:
        APP.API.notifyKickedOut(
            {
                id: getLocalParticipant(store.getState()).id,
                local: true
            },
            { id: action.participant.getId() }
        );
        break;

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

    case PARTICIPANT_KICKED:
        APP.API.notifyKickedOut(
            {
                id: action.kicked,
                local: false
            },
            { id: action.kicker });
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
