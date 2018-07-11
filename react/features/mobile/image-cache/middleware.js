/* @flow */

import { APP_WILL_MOUNT } from '../../base/app';
import {
    getAvatarURL,
    getLocalParticipant,
    getParticipantById,
    PARTICIPANT_ID_CHANGED,
    PARTICIPANT_JOINED,
    PARTICIPANT_UPDATED
} from '../../base/participants';
import { MiddlewareRegistry } from '../../base/redux';

import { ImageCache, prefetch } from './';

/**
 * The indicator which determines whether avatar URLs are to be prefetched in
 * the middleware here. Unless/until the implementation starts observing the
 * redux store instead of the respective redux actions, the value should very
 * likely be {@code false} because the middleware here is pretty much the last
 * to get a chance to figure out that an avatar URL may be used. Besides, it is
 * somewhat uninformed to download just about anything that may eventually be
 * used or not.
 *
 * @private
 * @type {boolean}
 */
const _PREFETCH_AVATAR_URLS = false;

/**
 * Middleware which captures app startup and conference actions in order to
 * clear the image cache.
 *
 * @returns {Function}
 */
MiddlewareRegistry.register(({ getState }) => next => action => {
    switch (action.type) {
    case APP_WILL_MOUNT:
        // XXX CONFERENCE_FAILED/LEFT are no longer used here because they
        // are tricky to get right as detectors of the moments in time at which
        // CachedImage is not used. Anyway, if ImageCache is to be cleared from
        // time to time, SET_LOCATION_URL is a much easier detector of such
        // opportune times. Fixes at least one 100%-reproducible case of
        // "TypeError: Cannot read property handlers of undefined." Anyway, in
        // order to reduce the re-downloading of the same avatars, eventually we
        // decided to not clear during the runtime of the app (other that at the
        // beginning that is).
        ImageCache && ImageCache.get().clear();
        break;

    case PARTICIPANT_ID_CHANGED:
    case PARTICIPANT_JOINED:
    case PARTICIPANT_UPDATED: {
        if (!_PREFETCH_AVATAR_URLS) {
            break;
        }

        const result = next(action);

        // Initiate the downloads of participants' avatars as soon as possible.

        // 1. Figure out the participant (instance).
        let { participant } = action;

        if (participant) {
            if (participant.id) {
                participant = getParticipantById(getState, participant.id);
            } else if (participant.local) {
                participant = getLocalParticipant(getState);
            } else {
                participant = undefined;
            }
        } else if (action.oldValue && action.newValue) {
            participant = getParticipantById(getState, action.newValue);
        }
        if (participant) {
            // 2. Get the participant's avatar URL.
            const uri = getAvatarURL(participant);

            if (uri) {
                // 3. Initiate the download of the participant's avatar.
                prefetch({ uri });
            }
        }

        return result;
    }
    }

    return next(action);
});
