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
    return (dispatch, getState) => {
        JitsiMeetJS.mediaDevices.isDeviceListAvailable()
            .then(isDeviceListAvailable => {
                const state = getState();
                const conference = state['features/base/conference'].conference;

                dispatch(openDialog(DeviceSelectionDialog, {
                    currentAudioOutputId: APP.settings.getAudioOutputDeviceId(),
                    currentAudioTrack: conference.getLocalAudioTrack(),
                    currentVideoTrack: conference.getLocalVideoTrack(),
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
