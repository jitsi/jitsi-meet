/* globals APP */

import { openDialog } from '../base/dialog';
import JitsiMeetJS from '../base/lib-jitsi-meet';

import { DeviceSelectionDialog } from './components';

/**
 * Open DeviceSelectionDialog with a configuration based on the environment's
 * supported abilities.
 *
 * @returns {Function}
 */
export function openDeviceSelectionDialog() {
    return dispatch => {
        JitsiMeetJS.mediaDevices.isDeviceListAvailable()
            .then(isDeviceListAvailable => {
                dispatch(openDialog(DeviceSelectionDialog, {
                    currentAudioInputId: APP.settings.getMicDeviceId(),
                    currentAudioOutputId: APP.settings.getAudioOutputDeviceId(),
                    currentVideoInputId: APP.settings.getCameraDeviceId(),
                    disableAudioInputChange:
                        !JitsiMeetJS.isMultipleAudioInputSupported(),
                    disableDeviceChange: !isDeviceListAvailable
                        || !JitsiMeetJS.mediaDevices.isDeviceChangeAvailable(),
                    hasAudioPermission: JitsiMeetJS.mediaDevices
                        .isDevicePermissionGranted('audio'),
                    hasVideoPermission: JitsiMeetJS.mediaDevices
                        .isDevicePermissionGranted('video'),
                    hideAudioInputPreview:
                        !JitsiMeetJS.isCollectingLocalStats(),
                    hideAudioOutputSelect: !JitsiMeetJS.mediaDevices
                        .isDeviceChangeAvailable('output')
                }));
            });
    };
}
