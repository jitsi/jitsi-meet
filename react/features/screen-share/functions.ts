import { IReduxState } from '../app/types';
import { getMultipleVideoSendingSupportFeatureFlag } from '../base/config/functions.any';
import { isWindows } from '../base/environment/environment';
import { isMobileBrowser } from '../base/environment/utils';
import { browser } from '../base/lib-jitsi-meet';
import { VIDEO_TYPE } from '../base/media/constants';
import { getLocalDesktopTrack, getLocalVideoTrack } from '../base/tracks/functions';

/**
 * Is the current screen sharing session audio only.
 *
 * @param {IReduxState} state - The state of the application.
 * @returns {boolean}
 */
export function isAudioOnlySharing(state: IReduxState) {
    return isScreenAudioShared(state) && !isScreenVideoShared(state);
}

/**
 * State of audio sharing.
 *
 * @param {IReduxState} state - The state of the application.
 * @returns {boolean}
 */
export function isScreenAudioShared(state: IReduxState) {
    return state['features/screen-share'].isSharingAudio;
}

/**
 * Returns the visibility of the audio only screen share button. Currently only chrome browser and electron on
 * windows supports this functionality.
 *
 * @returns {boolean}
 */
export function isScreenAudioSupported() {
    return (!isMobileBrowser() && browser.isChromiumBased()) || (browser.isElectron() && isWindows());
}

/**
 * Is any screen media currently being shared, audio or video.
 *
 * @param {IReduxState} state - The state of the application.
 * @returns {boolean}
 */
export function isScreenMediaShared(state: IReduxState) {
    return isScreenAudioShared(state) || isScreenVideoShared(state);
}

/**
 * Is screen sharing currently active.
 *
 * @param {IReduxState} state - The state of the application.
 * @returns {boolean}
 */
export function isScreenVideoShared(state: IReduxState) {
    const tracks = state['features/base/tracks'];
    const localScreenshare = getLocalDesktopTrack(tracks);

    if (getMultipleVideoSendingSupportFeatureFlag(state)) {
        return localScreenshare?.jitsiTrack && !localScreenshare.jitsiTrack.isMuted();
    }
    const localVideo = getLocalVideoTrack(tracks);

    return localVideo?.jitsiTrack?.getVideoType() === VIDEO_TYPE.DESKTOP;
}
