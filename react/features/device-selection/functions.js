// @flow
import { getAudioOutputDeviceId } from '../base/devices';
import JitsiMeetJS from '../base/lib-jitsi-meet';
import { toState } from '../base/redux';

/**
 * Returns the properties for the device selection dialog from Redux state.
 *
 * @param {(Function|Object)} stateful -The (whole) redux state, or redux's
 * {@code getState} function to be used to retrieve the state.
 * @returns {Object} - The properties for the device selection dialog.
 */
export function getDeviceSelectionDialogProps(stateful: Object | Function) {
    const state = toState(stateful);
    const settings = state['features/base/settings'];

    return {
        availableDevices: state['features/base/devices'],
        disableAudioInputChange:
            !JitsiMeetJS.isMultipleAudioInputSupported(),
        disableDeviceChange:
            !JitsiMeetJS.mediaDevices.isDeviceChangeAvailable(),
        hideAudioInputPreview:
            !JitsiMeetJS.isCollectingLocalStats(),
        hideAudioOutputSelect: !JitsiMeetJS.mediaDevices
                            .isDeviceChangeAvailable('output'),
        selectedAudioInputId: settings.micDeviceId,
        selectedAudioOutputId: getAudioOutputDeviceId(),
        selectedVideoInputId: settings.cameraDeviceId
    };
}
