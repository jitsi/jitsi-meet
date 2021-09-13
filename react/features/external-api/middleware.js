// @flow

import {
    CONFERENCE_FAILED,
    CONFERENCE_JOINED,
    KICKED_OUT
} from '../base/conference';
import { NOTIFY_CAMERA_ERROR, NOTIFY_MIC_ERROR } from '../base/devices';
import { JitsiConferenceErrors } from '../base/lib-jitsi-meet';
import {
    DOMINANT_SPEAKER_CHANGED,
    PARTICIPANT_KICKED,
    PARTICIPANT_LEFT,
    PARTICIPANT_JOINED,
    PARTICIPANT_ROLE_CHANGED,
    SET_LOADABLE_AVATAR_URL,
    getLocalParticipant,
    getParticipantById
} from '../base/participants';
import { MiddlewareRegistry } from '../base/redux';
import { getBaseUrl } from '../base/util';
import { appendSuffix } from '../display-name';
import { SUBMIT_FEEDBACK_ERROR, SUBMIT_FEEDBACK_SUCCESS } from '../feedback';
import { SET_FILMSTRIP_VISIBLE } from '../filmstrip';

import './subscriber';

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

        if (participant) {
            if (loadableAvatarUrl) {
                participant.loadableAvatarUrl !== loadableAvatarUrl && APP.API.notifyAvatarChanged(
                    id,
                    loadableAvatarUrl
                );
            } else {
                // There is no loadable explicit URL. In this case the Avatar component would
                // decide to render initials or the default avatar, but the external API needs
                // a URL when it needs to be rendered, so if there is no initials, we return the default
                // Avatar URL as if it was a usual avatar URL. If there are (or may be) initials
                // we send undefined to signal the api user that it's not an URL that needs to be rendered.
                //
                // NOTE: we may implement a special URL format later to signal that the avatar is based
                // on initials, that API consumers can handle as they want, e.g. initials://jm
                APP.API.notifyAvatarChanged(
                    id,
                    participant.name ? undefined : _getDefaultAvatarUrl()
                );
            }
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
        const { loadableAvatarUrl, name, id } = getLocalParticipant(state);

        APP.API.notifyConferenceJoined(
            room,
            id,
            {
                displayName: name,
                formattedDisplayName: appendSuffix(
                    name,
                    interfaceConfig.DEFAULT_LOCAL_DISPLAY_NAME
                ),
                avatarURL: loadableAvatarUrl
            }
        );
        break;
    }

    case DOMINANT_SPEAKER_CHANGED:
        APP.API.notifyDominantSpeakerChanged(action.participant.id);
        break;

    case KICKED_OUT:
        APP.API.notifyKickedOut(
            {
                id: getLocalParticipant(store.getState()).id,
                local: true
            },
            { id: action.participant ? action.participant.getId() : undefined }
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

    case PARTICIPANT_LEFT:
        APP.API.notifyUserLeft(action.participant.id);
        break;

    case PARTICIPANT_JOINED: {
        const { participant } = action;
        const { id, local, name } = participant;

        // The version of external api outside of middleware did not emit
        // the local participant being created.
        if (!local) {
            APP.API.notifyUserJoined(id, {
                displayName: name,
                formattedDisplayName: appendSuffix(
                    name || interfaceConfig.DEFAULT_REMOTE_DISPLAY_NAME)
            });
        }

        break;
    }

    case PARTICIPANT_ROLE_CHANGED:
        APP.API.notifyUserRoleChanged(action.participant.id, action.participant.role);
        break;

    case SET_FILMSTRIP_VISIBLE:
        APP.API.notifyFilmstripDisplayChanged(action.visible);
        break;

    case SUBMIT_FEEDBACK_ERROR:
        APP.API.notifyFeedbackSubmitted(action.error || 'Unknown error');
        break;

    case SUBMIT_FEEDBACK_SUCCESS:
        APP.API.notifyFeedbackSubmitted();
        break;
    }

    return result;
});

/**
 * Returns the absolute URL of the default avatar.
 *
 * @returns {string}
 */
function _getDefaultAvatarUrl() {
    return new URL('images/avatar.png', getBaseUrl()).href;
}
