import { IReduxState } from '../../app/types';
import { IStateful } from '../app/types';
import { toState } from '../redux/functions';

export * from './functions.any';

/**
 * Returns the deviceId for the currently used camera.
 *
 * @param {Object} state - The state of the application.
 * @returns {void}
 */
export function getCurrentCameraDeviceId(state: IReduxState) {
    return getDeviceIdByType(state, 'isVideoTrack');
}

/**
 * Returns the deviceId for the currently used microphone.
 *
 * @param {Object} state - The state of the application.
 * @returns {void}
 */
export function getCurrentMicDeviceId(state: IReduxState) {
    return getDeviceIdByType(state, 'isAudioTrack');
}

/**
 * Returns the deviceId for the currently used speaker.
 *
 * @param {Object} state - The state of the application.
 * @returns {void}
 */
export function getCurrentOutputDeviceId(state: IReduxState) {
    return state['features/base/settings'].audioOutputDeviceId;
}

/**
 * Returns the deviceId for the corresponding local track type.
 *
 * @param {Object} state - The state of the application.
 * @param {string} isType - Can be 'isVideoTrack' | 'isAudioTrack'.
 * @returns {string}
 */
function getDeviceIdByType(state: IReduxState, isType: string) {
    const [ deviceId ] = state['features/base/tracks']
        .map(t => t.jitsiTrack)
        .filter(t => t?.isLocal() && t[isType as keyof typeof t]())
        .map(t => t.getDeviceId());

    return deviceId || '';
}

/**
 * Returns the saved display name.
 *
 * @param {Object} state - The state of the application.
 * @returns {string}
 */
export function getDisplayName(state: IReduxState): string {
    return state['features/base/settings'].displayName || '';
}

/**
 * Searches known devices for a matching deviceId and fall back to matching on
 * label. Returns the stored preferred cameraDeviceId if a match is not found.
 *
 * @param {Object|Function} stateful - The redux state object or
 * {@code getState} function.
 * @returns {string}
 */
export function getUserSelectedCameraDeviceId(stateful: IStateful) {
    const state = toState(stateful);
    const {
        userSelectedCameraDeviceId,
        userSelectedCameraDeviceLabel
    } = state['features/base/settings'];
    const { videoInput } = state['features/base/devices'].availableDevices;

    return _getUserSelectedDeviceId({
        availableDevices: videoInput,

        // Operating systems may append " #{number}" somewhere in the label so
        // find and strip that bit.
        matchRegex: /\s#\d*(?!.*\s#\d*)/,
        userSelectedDeviceId: userSelectedCameraDeviceId,
        userSelectedDeviceLabel: userSelectedCameraDeviceLabel,
        replacement: ''
    });
}

/**
 * Searches known devices for a matching deviceId and fall back to matching on
 * label. Returns the stored preferred micDeviceId if a match is not found.
 *
 * @param {Object|Function} stateful - The redux state object or
 * {@code getState} function.
 * @returns {string}
 */
export function getUserSelectedMicDeviceId(stateful: IStateful) {
    const state = toState(stateful);
    const {
        userSelectedMicDeviceId,
        userSelectedMicDeviceLabel
    } = state['features/base/settings'];
    const { audioInput } = state['features/base/devices'].availableDevices;

    return _getUserSelectedDeviceId({
        availableDevices: audioInput,

        // Operating systems may append " ({number}-" somewhere in the label so
        // find and strip that bit.
        matchRegex: /\s\(\d*-\s(?!.*\s\(\d*-\s)/,
        userSelectedDeviceId: userSelectedMicDeviceId,
        userSelectedDeviceLabel: userSelectedMicDeviceLabel,
        replacement: ' ('
    });
}

/**
 * Searches known devices for a matching deviceId and fall back to matching on
 * label. Returns the stored preferred audioOutputDeviceId if a match is not found.
 *
 * @param {Object|Function} stateful - The redux state object or
 * {@code getState} function.
 * @returns {string}
 */
export function getUserSelectedOutputDeviceId(stateful: IStateful) {
    const state = toState(stateful);
    const {
        userSelectedAudioOutputDeviceId,
        userSelectedAudioOutputDeviceLabel
    } = state['features/base/settings'];
    const { audioOutput } = state['features/base/devices'].availableDevices;

    return _getUserSelectedDeviceId({
        availableDevices: audioOutput,
        matchRegex: undefined,
        userSelectedDeviceId: userSelectedAudioOutputDeviceId,
        userSelectedDeviceLabel: userSelectedAudioOutputDeviceLabel,
        replacement: undefined
    });
}

/**
 * A helper function to abstract the logic for choosing which device ID to
 * use. Falls back to fuzzy matching on label if a device ID match is not found.
 *
 * @param {Object} options - The arguments used to match find the preferred
 * device ID from available devices.
 * @param {Array<string>} options.availableDevices - The array of currently
 * available devices to match against.
 * @param {Object} options.matchRegex - The regex to use to find strings
 * appended to the label by the operating system. The matches will be replaced
 * with options.replacement, with the intent of matching the same device that
 * might have a modified label.
 * @param {string} options.userSelectedDeviceId - The device ID the participant
 * prefers to use.
 * @param {string} options.userSelectedDeviceLabel - The label associated with the
 * device ID the participant prefers to use.
 * @param {string} options.replacement - The string to use with
 * options.matchRegex to remove identifies added to the label by the operating
 * system.
 * @private
 * @returns {string} The preferred device ID to use for media.
 */
function _getUserSelectedDeviceId(options: {
    availableDevices: MediaDeviceInfo[] | undefined;
    matchRegex?: RegExp;
    replacement?: string;
    userSelectedDeviceId?: string;
    userSelectedDeviceLabel?: string;
}) {
    const {
        availableDevices,
        matchRegex = '',
        userSelectedDeviceId,
        userSelectedDeviceLabel,
        replacement = ''
    } = options;

    if (userSelectedDeviceId) {
        const foundMatchingBasedonDeviceId = availableDevices?.find(
            candidate => candidate.deviceId === userSelectedDeviceId);

        // Prioritize matching the deviceId
        if (foundMatchingBasedonDeviceId) {
            return userSelectedDeviceId;
        }
    }

    // If there is no label at all, there is no need to fall back to checking
    // the label for a fuzzy match.
    if (!userSelectedDeviceLabel) {
        return;
    }

    const strippedDeviceLabel
        = matchRegex ? userSelectedDeviceLabel.replace(matchRegex, replacement)
            : userSelectedDeviceLabel;
    const foundMatchBasedOnLabel = availableDevices?.find(candidate => {
        const { label } = candidate;

        if (!label) {
            return false;
        } else if (strippedDeviceLabel === label) {
            return true;
        }

        const strippedCandidateLabel
            = label.replace(matchRegex, replacement);

        return strippedDeviceLabel === strippedCandidateLabel;
    });

    return foundMatchBasedOnLabel?.deviceId;
}
