import { IStore } from '../../app/types';
import { SET_AUDIO_MUTED } from '../media/actionTypes';
import {
    MEDIA_TYPE,
    VIDEO_TYPE
} from '../media/constants';
import MiddlewareRegistry from '../redux/MiddlewareRegistry';

import {
    TRACK_UPDATED
} from './actionTypes';
import {
    createLocalTracksA,
    toggleScreensharing,
    trackMuteUnmuteFailed
} from './actions.native';
import { getLocalTrack, setTrackMuted } from './functions.any';

import './middleware.any';

/**
 * Middleware that captures LIB_DID_DISPOSE and LIB_DID_INIT actions and,
 * respectively, creates/destroys local media tracks. Also listens to
 * media-related actions and performs corresponding operations with tracks.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case SET_AUDIO_MUTED: {
        _setMuted(store, action);
        break;
    }
    case TRACK_UPDATED: {
        const { jitsiTrack, local } = action.track;

        if (local && jitsiTrack.isMuted()
                    && jitsiTrack.type === MEDIA_TYPE.VIDEO && jitsiTrack.videoType === VIDEO_TYPE.DESKTOP) {
            store.dispatch(toggleScreensharing(false));
        }
        break;
    }
    }

    return next(action);
});

/**
 * Mutes or unmutes a local track with a specific media type.
 *
 * @param {Store} store - The redux store in which the specified action is dispatched.
 * @param {Action} action - The redux action dispatched in the specified store.
 * @private
 * @returns {void}
 */
function _setMuted(store: IStore, { ensureTrack, muted }: {
    ensureTrack: boolean; muted: boolean; }) {
    const { dispatch, getState } = store;
    const state = getState();
    const localTrack = getLocalTrack(state['features/base/tracks'], MEDIA_TYPE.AUDIO, /* includePending */ true);

    if (localTrack) {
        // The `jitsiTrack` property will have a value only for a localTrack for which `getUserMedia` has already
        // completed. If there's no `jitsiTrack`, then the `muted` state will be applied once the `jitsiTrack` is
        // created.
        const { jitsiTrack } = localTrack;

        if (jitsiTrack) {
            setTrackMuted(jitsiTrack, muted, state, dispatch)
                .catch(() => dispatch(trackMuteUnmuteFailed(localTrack, muted)));
        }
    } else if (!muted && ensureTrack) {
        dispatch(createLocalTracksA({ devices: [ MEDIA_TYPE.AUDIO ] }));
    }
}
