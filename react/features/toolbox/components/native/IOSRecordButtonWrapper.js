// @flow
import React, {PureComponent} from 'react';
import RecordNativeComponent from './IOSRecordButton';

import { translate } from '../../../base/i18n';
import { IconShareDesktop } from '../../../base/icons';
import {
    connect,
    MiddlewareRegistry
} from '../../../base/redux';

import { getLocalTrack, getLocalVideoTrack, createLocalTracksF, replaceLocalTrack } from '../../../base/tracks';
import { createTaskQueue } from '../../../../../modules/util/helpers';
import {
    TRACK_WILL_CREATE
} from '../../../base/tracks/actionTypes';
import { JitsiTrackErrors, JitsiTrackEvents } from '../../../base/lib-jitsi-meet';

type Props = {
     /**
     * Whether the current conference is in audio only mode or not.
     */
    _audioOnly: boolean,

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function
};
type State = {};

class IOSRecordButtonWrapper extends PureComponent<Props,*> {

    recordingStarted = () => {
        console.log("create tracks for screen sharing and make way for the frames");
        this.props.dispatch({ type: 'START_SCREEN_SHARING' });
    }

    recordingEnded = () => {
        console.log("switch back to camera track");
        // do we need to worry about messed up states? 
        // would diff start stop dispatches be better?
        this.props.dispatch({ type: 'END_SCREEN_SHARING' });
    }

    render() {
        return <RecordNativeComponent
            // send button label in props to maintain translated strings in react native
            onStart={() => {this.recordingStarted();}}
            onEnd={() => {this.recordingEnded();}}
            style={{width: 200, height: 50}} 
            ref={comp => { this.recordComponent = comp; }} 
        />
    }
}


/**
 * Maps (parts of) the redux state to {@link DesktopSharingButton}'s React {@code Component}
 * props.
 *
 * @param {Object} state - The redux store/state.
 * @private
 * @returns {{}}
 */
function _mapStateToProps(state) {
    const { enabled: audioOnly } = state['features/base/audio-only'];
    const localVideo = getLocalVideoTrack(state['features/base/tracks']);

    return {
        _audioOnly: Boolean(audioOnly),
        _sharingScreen: Boolean(localVideo && localVideo.videoType === 'desktop')
    };
}

export default translate(connect(_mapStateToProps)(IOSRecordButtonWrapper));


/**
 * A task queue for replacement local video tracks. This separate queue exists
 * so video replacement is not blocked by audio replacement tasks in the queue
 * {@link _replaceLocalAudioTrackQueue}.
 */
const _replaceLocalVideoTrackQueue = createTaskQueue();

let videoSwitchInProgress;

/**
 * Stores the "untoggle" handler which remembers whether was
 * there any video before and whether was it muted.
 */
let didHaveVideo, wasVideoMuted;

/**
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case 'END_SCREEN_SHARING':
        _untoggleScreenSharing(store);
        break;
    
    case 'START_SCREEN_SHARING':
        _toggleScreenSharing(store);
        break;
    }
    return next(action);
});

/**
 * Toggles between screen sharing and camera video if the toggle parameter
 * is not specified and starts the procedure for obtaining new screen
 * sharing/video track otherwise.
 */
function _toggleScreenSharing(store) {
    const state = store.getState();
    if (!videoSwitchInProgress) {
        const tracks = state['features/base/tracks'];
        const localVideo = getLocalVideoTrack(tracks);
        if (localVideo && localVideo.videoType === 'desktop') {
            _untoggleScreenSharing(store);
            return;
        }
        _switchToScreenSharing(store, tracks, localVideo);
    }
}

/**
 * Tries to switch to the screensharing mode by disposing camera stream and
 * replacing it with a desktop one.
 */
function _switchToScreenSharing(store, tracks, localVideo) {
    videoSwitchInProgress = true;

    didHaveVideo = Boolean(localVideo);
    wasVideoMuted = !localVideo || localVideo.muted;
    createLocalTrackF(store, tracks, 'desktop').then(desktopStream => {
        desktopStream.on(JitsiTrackEvents.LOCAL_TRACK_STOPPED, () => _untoggleScreenSharing(store));
        return desktopStream;
    }).then(stream => useVideoStream(store.dispatch, localVideo, stream)).then(() => { videoSwitchInProgress = false; }).catch(() => {
        videoSwitchInProgress = false, _untoggleScreenSharing(store);
    })
}

/**
 * Request to start capturing local audio and/or video. By default, the user
 * facing camera will be selected.
 * 
 * @returns {Promise}
 */
function createLocalTrackF({ dispatch, getState }, tracks, device) {
    // The following executes on React Native only at the time of this
    // writing. The effort to port Web's createInitialLocalTracksAndConnect
    // is significant and that's where the function createLocalTracksF got
    // born. I started with the idea a porting so that we could inherit the
    // ability to getUserMedia for audio only or video only if getUserMedia
    // for audio and video fails. Eventually though, I realized that on
    // mobile we do not have combined permission prompts implemented anyway
    // (either because there are no such prompts or it does not make sense
    // to implement them) and the right thing to do is to ask for each
    // device separately.
    const track = getLocalTrack(tracks, device === 'audio' ? 'audio' : 'video', /* includePending */ true);
    if (track) {
        if (track.mediaType == 'audio' || (device === 'video' && track.videoType !== 'desktop') || (device !== 'video' && track.videoType === 'desktop')) {
            let err = new Error(`Local track for ${device} already exists.`);
            err.name = 'LOCAL_TRACK_EXISTS';
            return Promise.reject(err);
        }
    }
    const gumProcess = createLocalTracksF({ devices: [ device ] }, false, { dispatch, getState }).then(localTracks => {
        // Because GUM is called for 1 device (which is actually
        // a media type 'audio', 'video', 'screen', etc.) we
        // should not get more than one JitsiTrack.
        if (localTracks.length !== 1) {
            throw new Error(
                `Expected exactly 1 track, but was given ${
                    localTracks.length} tracks for device: ${
                    device}.`);
        }

        if (gumProcess.canceled) {
            return Promise.all(
                localTracks.map(t =>
                    t.dispose()
                        .catch(err => {
                            // Track might be already disposed so ignore such an error.
                            // Of course, re-throw any other error(s).
                            if (err.name !== JitsiTrackErrors.TRACK_IS_DISPOSED) {
                                throw err;
                            }
                        }))).then(() => {
                dispatch({
                    type: TRACK_CREATE_CANCELED,
                    trackType: device
                });
                throw new Error();
            });
        }
        return localTracks[0];
    }).catch(error => {
        dispatch(gumProcess.canceled ? {
            type: TRACK_CREATE_CANCELED,
            trackType: device
        } : dispatch => {
            if (error) {
                dispatch({
                    type: TRACK_CREATE_ERROR,
                    permissionDenied: error.name === 'SecurityError',
                    trackType: device
                });
            }
        })
    });

    /**
     * Cancels the {@code getUserMedia} process represented by this
     * {@code Promise}.
     *
     * @returns {Promise} This {@code Promise} i.e. {@code gumProcess}.
     */
    gumProcess.cancel = () => {
        gumProcess.canceled = true;

        return gumProcess;
    };

    dispatch({
        type: TRACK_WILL_CREATE,
        track: {
            gumProcess,
            local: true,
            mediaType: device === 'desktop' ? 'video' : device
        }
    });

    return gumProcess;
}

/**
 * Start using provided video stream.
 * Stops previous video stream.
 * @param {JitsiLocalTrack} [stream] new stream to use or null
 * @returns {Promise}
 */
function useVideoStream(dispatch, localVideo = { }, newStream) {
    return new Promise((resolve, reject) => {
        _replaceLocalVideoTrackQueue.enqueue(_onTaskComplete => {
            dispatch(replaceLocalTrack(localVideo.jitsiTrack, newStream)).then(resolve).catch(reject).then(_onTaskComplete);
        });
    });
}


/**
 * Turns off the screen sharing and restores
 * the previous state described by the arguments.
 */
function _untoggleScreenSharing({ dispatch, getState }) {
    videoSwitchInProgress = true;
    const tracks = getState()['features/base/tracks'];
    const localVideo = getLocalVideoTrack(tracks);
    let promise;
    if (didHaveVideo) {
        promise = createLocalTrackF({ dispatch, getState }, tracks, 'video')
            .then(stream => useVideoStream(dispatch, localVideo, stream)
                .then(() => stream))
                    .then(localVideo => {
            if (wasVideoMuted) {
                localVideo.mute();
            }
        }).catch(error => {
            // Still fail with the original err
            return error.name === 'LOCAL_TRACK_EXISTS' ? Promise.reject(error) : useVideoStream(dispatch, localVideo, null).then(() => {
                throw error;
            });
        });
    } else {
        promise = useVideoStream(dispatch, localVideo, null);
    }
    promise.then(() => { videoSwitchInProgress = false; }).catch(error => { videoSwitchInProgress = false; });
}