import { IReduxState, IStore } from '../../app/types';
// eslint-disable-next-line lines-around-comment
// @ts-ignore
import { setPictureInPictureEnabled } from '../../mobile/picture-in-picture/functions';
import { setAudioOnly } from '../audio-only/actions';
import JitsiMeetJS from '../lib-jitsi-meet';

import { destroyLocalDesktopTrackIfExists, replaceLocalTrack } from './actions.any';
import { getLocalVideoTrack, isLocalVideoTrackDesktop } from './functions.native';
import { TrackOperationType } from './types';
/* eslint-enable lines-around-comment */

export * from './actions.any';

/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 * Signals that the local participant is ending screensharing or beginning the screensharing flow.
 *
 * @param {boolean} enabled - The state to toggle screen sharing to.
 * @param {boolean} _ignore1 - Ignored.
 * @param {any} _ignore2 - Ignored.
 * @returns {Function}
 */
export function toggleScreensharing(enabled: boolean, _ignore1?: boolean, _ignore2?: any) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();

        if (enabled) {
            const isSharing = isLocalVideoTrackDesktop(state);

            if (!isSharing) {
                _startScreenSharing(dispatch, state);
            }
        } else {
            dispatch(destroyLocalDesktopTrackIfExists());
            setPictureInPictureEnabled(true);
        }
    };
}

/* eslint-enable @typescript-eslint/no-unused-vars */

/**
 * Creates desktop track and replaces the local one.
 *
 * @private
 * @param {Dispatch} dispatch - The redux {@code dispatch} function.
 * @param {Object} state - The redux state.
 * @returns {void}
 */
function _startScreenSharing(dispatch: Function, state: IReduxState) {
    setPictureInPictureEnabled(false);

    JitsiMeetJS.createLocalTracks({ devices: [ 'desktop' ] })
    .then((tracks: any[]) => {
        const track = tracks[0];
        const currentLocalTrack = getLocalVideoTrack(state['features/base/tracks']);
        const currentJitsiTrack = currentLocalTrack?.jitsiTrack;

        dispatch(replaceLocalTrack(currentJitsiTrack, track));

        const { enabled: audioOnly } = state['features/base/audio-only'];

        if (audioOnly) {
            dispatch(setAudioOnly(false));
        }
    })
    .catch((error: any) => {
        console.log('ERROR creating ScreeSharing stream ', error);

        setPictureInPictureEnabled(true);
    });
}


/**
 * Executes a track operation.
 *
 * NOTE: This is dummy implementation for mobile. Currently we are not sure if we need to chain the track operations.
 * For now we are just executing the passed operation without chaining it.
 *
 * @param {TrackOperationType} type - The type of the operation ('audio', 'video' or 'audio-video').
 * @param {Function} operation - The operation.
 * @returns {{
 *      type: SET_TRACK_OPERATIONS_PROMISE,
 *      audioTrackOperationsPromise: Promise<void>,
 *      videoTrackOperationsPromise: Promise<void>
 * }}
 */
export function executeTrackOperation(type: TrackOperationType, operation: () => Promise<any>) {
    return () => operation();
}
