/* @flow */

import UIEvents from '../../../../service/UI/UIEvents';

import {
    CONFERENCE_JOINED,
    CONFERENCE_LEFT
} from '../conference';
import { MiddlewareRegistry } from '../redux';

import { localParticipantIdChanged } from './actions';
import {
    KICK_PARTICIPANT,
    MUTE_REMOTE_PARTICIPANT,
    PARTICIPANT_DISPLAY_NAME_CHANGED,
    PARTICIPANT_JOINED,
    PARTICIPANT_UPDATED
} from './actionTypes';
import { LOCAL_PARTICIPANT_DEFAULT_ID } from './constants';
import {
    getAvatarURLByParticipantId,
    getLocalParticipant
} from './functions';

declare var APP: Object;

/**
 * Middleware that captures CONFERENCE_JOINED and CONFERENCE_LEFT actions and
 * updates respectively ID of local participant.
 *
 * @param {Store} store - Redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    const { conference } = store.getState()['features/base/conference'];

    switch (action.type) {
    case CONFERENCE_JOINED:
        store.dispatch(localParticipantIdChanged(action.conference.myUserId()));
        break;

    case CONFERENCE_LEFT:
        store.dispatch(localParticipantIdChanged(LOCAL_PARTICIPANT_DEFAULT_ID));
        break;

    case KICK_PARTICIPANT:
        conference.kickParticipant(action.id);
        break;

    case MUTE_REMOTE_PARTICIPANT:
        conference.muteParticipant(action.id);
        break;

    // TODO Remove this middleware when the local display name update flow is
    // fully brought into redux.
    case PARTICIPANT_DISPLAY_NAME_CHANGED: {
        if (typeof APP !== 'undefined') {
            const participant = getLocalParticipant(store.getState());

            if (participant && participant.id === action.id) {
                APP.UI.emitEvent(UIEvents.NICKNAME_CHANGED, action.name);
            }
        }

        break;
    }

    case PARTICIPANT_JOINED:
    case PARTICIPANT_UPDATED: {
        if (typeof APP !== 'undefined') {
            const participant = action.participant;
            const { id, local } = participant;

            let idToSearch = id;

            // Support the workaround where the id for the local user is
            // hardcoded to be "local" on initial conference join.
            if (!id && local) {
                idToSearch = 'local';
            }

            const preUpdateAvatarURL
                = getAvatarURLByParticipantId(store.getState(), idToSearch);

            const result = next(action);

            const postUpdateAvatarURL
                = getAvatarURLByParticipantId(store.getState(), idToSearch);

            if (preUpdateAvatarURL !== postUpdateAvatarURL) {
                APP.API.notifyAvatarChanged(
                    participant.local
                        ? APP.conference.getMyUserId() : participant.id,
                    postUpdateAvatarURL
                );
            }

            return result;
        }

        break;
    }
    }

    return next(action);
});
