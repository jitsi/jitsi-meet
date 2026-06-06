import { IReduxState, IStore } from '../app/types';
import { showWarningNotification } from '../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE } from '../notifications/constants';
import { isScreenAudioShared } from '../screen-share/functions';

/**
 * Is noise suppression currently enabled.
 *
 * @param {IReduxState} state - The state of the application.
 * @returns {boolean}
 */
export function isNoiseSuppressionEnabled(state: IReduxState): boolean {
    return state['features/noise-suppression'].enabled;
}

/**
 * Verify if noise suppression can be enabled in the current state.
 *
 * @param {*} state - Redux state.
 * @param {*} dispatch - Redux dispatch.
 * @param {*} localAudio - Current local audio track.
 * @returns {boolean}
 */
export function canEnableNoiseSuppression(state: IReduxState, dispatch: IStore['dispatch'], localAudio: any): boolean {
    const { channelCount } = localAudio.track.getSettings();

    // Sharing screen audio implies an effect being applied to the local track, because currently we don't support
    // more then one effect at a time the user has to choose between sharing audio or having noise suppression active.
    if (isScreenAudioShared(state)) {
        dispatch(showWarningNotification({
            titleKey: 'notify.noiseSuppressionFailedTitle',
            descriptionKey: 'notify.noiseSuppressionDesktopAudioDescription'
        }, NOTIFICATION_TIMEOUT_TYPE.MEDIUM));

        return false;
    }

    // Stereo audio tracks aren't currently supported, make sure the current local track is mono
    if (channelCount > 1) {
        dispatch(showWarningNotification({
            titleKey: 'notify.noiseSuppressionFailedTitle',
            descriptionKey: 'notify.noiseSuppressionStereoDescription'
        }, NOTIFICATION_TIMEOUT_TYPE.MEDIUM));

        return false;
    }

    return true;
}
