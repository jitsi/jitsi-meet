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

            const preUpdateAvatarURL
                = getAvatarURLByParticipantId(store.getState(), id);

            // Allow the redux update to go through and compare the old avatar
            // to the new avatar and emit out change events if necessary.
            const result = next(action);

            const postUpdateAvatarURL
                = getAvatarURLByParticipantId(store.getState(), id);

            if (preUpdateAvatarURL !== postUpdateAvatarURL) {
                const currentKnownId = local
                    ? APP.conference.getMyUserId() : id;

                APP.UI.refreshAvatarDisplay(
                    currentKnownId, postUpdateAvatarURL);
                APP.API.notifyAvatarChanged(
                    currentKnownId, postUpdateAvatarURL);
            }

            return result;
        }

        break;
    }
    }

    return next(action);
});
