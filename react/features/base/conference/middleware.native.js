// @flow

import { setPictureInPictureDisabled } from '../../mobile/picture-in-picture/functions';
import { setAudioOnly } from '../audio-only';
import JitsiMeetJS from '../lib-jitsi-meet';
import { MiddlewareRegistry } from '../redux';
import { TOGGLE_SCREENSHARING } from '../tracks/actionTypes';
import { destroyLocalDesktopTrackIfExists, replaceLocalTrack } from '../tracks/actions';
import { getLocalVideoTrack, isLocalVideoTrackDesktop } from '../tracks/functions';

import './middleware.any';

MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case TOGGLE_SCREENSHARING: {
        _toggleScreenSharing(store);
        break;
    }
    }

    return next(action);
});

/**
 * Toggles screen sharing.
 *
 * @private
 * @param {Store} store - The redux.
 * @returns {void}
 */
function _toggleScreenSharing(store) {
    const { dispatch, getState } = store;
    const state = getState();

    const isSharing = isLocalVideoTrackDesktop(state);

    if (isSharing) {
        dispatch(destroyLocalDesktopTrackIfExists());
    } else {
        _startScreenSharing(dispatch, state);
    }
}

/**
 * Creates desktop track and replaces the local one.
 *
 * @private
 * @param {Dispatch} dispatch - The redux {@code dispatch} function.
 * @param {Object} state - The redux state.
 * @returns {void}
 */
function _startScreenSharing(dispatch, state) {
    setPictureInPictureDisabled(true);

    JitsiMeetJS.createLocalTracks({ devices: [ 'desktop' ] })
    .then(tracks => {
        const track = tracks[0];
        const currentLocalTrack = getLocalVideoTrack(state['features/base/tracks']);
        const currentJitsiTrack = currentLocalTrack && currentLocalTrack.jitsiTrack;

        dispatch(replaceLocalTrack(currentJitsiTrack, track));

        const { enabled: audioOnly } = state['features/base/audio-only'];

        if (audioOnly) {
            dispatch(setAudioOnly(false));
        }
    })
    .catch(error => {
        console.log('ERROR creating ScreeSharing stream ', error);

        setPictureInPictureDisabled(false);
    });
}
