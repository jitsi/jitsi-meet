import { NativeModules, Platform } from 'react-native';

import { IReduxState, IStore } from '../../app/types';
import { setPictureInPictureEnabled } from '../../mobile/picture-in-picture/functions';
import { showNotification } from '../../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE } from '../../notifications/constants';
import JitsiMeetJS from '../lib-jitsi-meet';
import {
    setScreenshareMuted,
    setVideoMuted
} from '../media/actions';
import { VIDEO_MUTISM_AUTHORITY } from '../media/constants';

import { addLocalTrack, replaceLocalTrack } from './actions.any';
import { getLocalDesktopTrack, getTrackState, isLocalVideoTrackDesktop } from './functions.native';

const { JitsiMeetMediaProjectionModule } = NativeModules;

export * from './actions.any';

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
                Platform.OS === 'android' && JitsiMeetMediaProjectionModule.launch();
            }

            Platform.OS === 'android' && JitsiMeetMediaProjectionModule.abort();
        } else {
            dispatch(setScreenshareMuted(true));
            dispatch(setVideoMuted(false, VIDEO_MUTISM_AUTHORITY.SCREEN_SHARE));
            setPictureInPictureEnabled(true);
        }
    };
}

/**
 * Creates desktop track and replaces the local one.
 *
 * @private
 * @param {Dispatch} dispatch - The redux {@code dispatch} function.
 * @param {Object} state - The redux state.
 * @returns {void}
 */
async function _startScreenSharing(dispatch: IStore['dispatch'], state: IReduxState) {
    setPictureInPictureEnabled(false);

    try {
        const tracks: any[] = await JitsiMeetJS.createLocalTracks({ devices: [ 'desktop' ] });
        const track = tracks[0];
        const currentLocalDesktopTrack = getLocalDesktopTrack(getTrackState(state));
        const currentJitsiTrack = currentLocalDesktopTrack?.jitsiTrack;

        // The first time the user shares the screen we add the track and create the transceiver.
        // Afterwards, we just replace the old track, so the transceiver will be reused.
        if (currentJitsiTrack) {
            dispatch(replaceLocalTrack(currentJitsiTrack, track));
        } else {
            dispatch(addLocalTrack(track));
        }

        dispatch(setVideoMuted(true, VIDEO_MUTISM_AUTHORITY.SCREEN_SHARE));

        const { enabled: audioOnly } = state['features/base/audio-only'];

        if (audioOnly) {
            dispatch(showNotification({
                titleKey: 'notify.screenSharingAudioOnlyTitle',
                descriptionKey: 'notify.screenSharingAudioOnlyDescription',
                maxLines: 3
            }, NOTIFICATION_TIMEOUT_TYPE.LONG));
        }
    } catch (error: any) {
        console.log('ERROR creating screen-sharing stream ', error);

        setPictureInPictureEnabled(true);
    }
}
