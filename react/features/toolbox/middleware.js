/* @flow */

import {
    MEDIA_TYPE,
    SET_AUDIO_AVAILABLE,
    SET_VIDEO_AVAILABLE
} from '../base/media';
import { MiddlewareRegistry } from '../base/redux';
import { isLocalTrackMuted, TRACK_UPDATED } from '../base/tracks';

import { setToolbarButton } from './actions';
import { CLEAR_TOOLBOX_TIMEOUT, SET_TOOLBOX_TIMEOUT } from './actionTypes';

/**
 * Middleware which intercepts Toolbox actions to handle changes to the
 * visibility timeout of the Toolbox.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case CLEAR_TOOLBOX_TIMEOUT: {
        const { timeoutID } = store.getState()['features/toolbox'];

        clearTimeout(timeoutID);
        break;
    }

    case SET_AUDIO_AVAILABLE:
        return _setMediaAvailableOrMuted(store, next, action);

    case SET_TOOLBOX_TIMEOUT: {
        const { timeoutID } = store.getState()['features/toolbox'];
        const { handler, timeoutMS } = action;

        clearTimeout(timeoutID);
        const newTimeoutId = setTimeout(handler, timeoutMS);

        action.timeoutID = newTimeoutId;
        break;
    }

    case SET_VIDEO_AVAILABLE:
        return _setMediaAvailableOrMuted(store, next, action);

    case TRACK_UPDATED:
        if (action.track.jitsiTrack.isLocal()) {
            return _setMediaAvailableOrMuted(store, next, action);
        }
        break;
    }

    return next(action);
});

/**
 * Adjusts the state of toolbar's microphone or camera button.
 *
 * @param {Store} store - The redux store.
 * @param {Function} next - The redux function to continue dispatching the
 * specified {@code action} in the specified {@code store}.
 * @param {Object} action - {@code SET_AUDIO_AVAILABLE},
 * {@code SET_VIDEO_AVAILABLE}, or {@code TRACK_UPDATED}.
 * @returns {*}
 */
function _setMediaAvailableOrMuted({ dispatch, getState }, next, action) {
    const result = next(action);

    let mediaType;

    switch (action.type) {
    case SET_AUDIO_AVAILABLE:
        mediaType = MEDIA_TYPE.AUDIO;
        break;

    case SET_VIDEO_AVAILABLE:
        mediaType = MEDIA_TYPE.VIDEO;
        break;

    case TRACK_UPDATED:
        mediaType
            = action.track.jitsiTrack.isAudioTrack()
                ? MEDIA_TYPE.AUDIO
                : MEDIA_TYPE.VIDEO;
        break;

    default:
        throw new Error(`Unsupported action ${action}`);
    }

    const state = getState();
    const { audio, video } = state['features/base/media'];
    const { available } = mediaType === MEDIA_TYPE.AUDIO ? audio : video;
    const i18nKey
        = mediaType === MEDIA_TYPE.AUDIO
            ? available ? 'mute' : 'micDisabled'
            : available ? 'videomute' : 'cameraDisabled';
    const tracks = state['features/base/tracks'];
    const muted = isLocalTrackMuted(tracks, mediaType);

    dispatch(
        setToolbarButton(
            mediaType === MEDIA_TYPE.AUDIO ? 'microphone' : 'camera',
            {
                enabled: available,
                i18n: `[content]toolbar.${i18nKey}`,
                toggled: available ? muted : true
            }));

    return result;
}
