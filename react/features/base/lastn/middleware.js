// @flow

import { getLogger } from 'jitsi-meet-logger';

import { SET_FILMSTRIP_ENABLED } from '../../filmstrip/actionTypes';
import { APP_STATE_CHANGED } from '../../mobile/background/actionTypes';

import { SET_AUDIO_ONLY } from '../audio-only';
import { CONFERENCE_JOINED } from '../conference/actionTypes';
import { MiddlewareRegistry } from '../redux';

import { setLastN } from './actions';
import { SET_LASTN } from './actionTypes';

declare var APP: Object;

const logger = getLogger('features/base/lastn');


MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case APP_STATE_CHANGED:
        return _appStateChanged(store, next, action);

    case CONFERENCE_JOINED:
        return _conferenceJoined(store, next, action);

    case SET_AUDIO_ONLY:
        return _setAudioOnly(store, next, action);

    case SET_FILMSTRIP_ENABLED:
        return _setFilmstripEnabled(store, next, action);

    case SET_LASTN:
        return _setLastN(store, next, action);
    }

    return next(action);
});

/**
 * Adjusts the lasN value based on the app state.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Dispatch} next - The redux {@code dispatch} function to dispatch the
 * specified {@code action} to the specified {@code store}.
 * @param {Action} action - The redux action {@code APP_STATE_CHANGED} which is
 * being dispatched in the specified {@code store}.
 * @private
 * @returns {Object} The value returned by {@code next(action)}.
 */
function _appStateChanged({ dispatch, getState }, next, action) {
    const { enabled: audioOnly } = getState()['features/base/audio-only'];

    if (!audioOnly) {
        const { appState } = action;
        const lastN = appState === 'active' ? undefined : 0;

        dispatch(setLastN(lastN));
        logger.log(`App state changed - updated lastN to ${String(lastN)}`);
    }

    return next(action);
}

/**
 * Adjusts the lasN value upon joining a conference.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Dispatch} next - The redux {@code dispatch} function to dispatch the
 * specified {@code action} to the specified {@code store}.
 * @param {Action} action - The redux action {@code CONFERENCE_JOINED} which is
 * being dispatched in the specified {@code store}.
 * @private
 * @returns {Object} The value returned by {@code next(action)}.
 */
function _conferenceJoined({ dispatch, getState }, next, action) {
    const { conference } = action;
    const { enabled: audioOnly } = getState()['features/base/audio-only'];

    audioOnly && conference.getLastN() !== 0 && dispatch(setLastN(0));

    return next(action);
}

/**
 * Sets the audio-only flag for the current conference. When audio-only is set,
 * local video is muted and last N is set to 0 to avoid receiving remote video.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Dispatch} next - The redux {@code dispatch} function to dispatch the
 * specified {@code action} to the specified {@code store}.
 * @param {Action} action - The redux action {@code SET_AUDIO_ONLY} which is
 * being dispatched in the specified {@code store}.
 * @private
 * @returns {Object} The value returned by {@code next(action)}.
 */
function _setAudioOnly({ dispatch }, next, action) {
    const { audioOnly } = action;

    // Set lastN to 0 in case audio-only is desired; leave it as undefined,
    // otherwise, and the default lastN value will be chosen automatically.
    dispatch(setLastN(audioOnly ? 0 : undefined));

    return next(action);
}

/**
 * Notifies the feature filmstrip that the action {@link SET_FILMSTRIP_ENABLED}
 * is being dispatched within a specific redux store.
 *
 * @param {Store} store - The redux store in which the specified action is being
 * dispatched.
 * @param {Dispatch} next - The redux dispatch function to dispatch the
 * specified action to the specified store.
 * @param {Action} action - The redux action {@code SET_FILMSTRIP_ENABLED} which
 * is being dispatched in the specified store.
 * @private
 * @returns {Object} The value returned by {@code next(action)}.
 */
function _setFilmstripEnabled({ dispatch, getState }, next, action) {
    // FIXME This action is not currently dispatched on web.
    if (typeof APP === 'undefined') {
        const { enabled } = action;
        const { enabled: audioOnly } = getState()['features/base/audio-only'];

        audioOnly || dispatch(setLastN(enabled ? undefined : 1));
    }

    return next(action);
}

/**
 * Sets the last N (value) of the video channel in the conference.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Dispatch} next - The redux {@code dispatch} function to dispatch the
 * specified {@code action} to the specified {@code store}.
 * @param {Action} action - The redux action {@code SET_LASTN} which is being
 * dispatched in the specified {@code store}.
 * @private
 * @returns {Object} The value returned by {@code next(action)}.
 */
function _setLastN({ getState }, next, action) {
    const { conference } = getState()['features/base/conference'];

    if (conference) {
        try {
            conference.setLastN(action.lastN);
        } catch (err) {
            logger.error(`Failed to set lastN: ${err}`);
        }
    }

    return next(action);
}
