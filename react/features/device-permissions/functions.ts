import { IReduxState } from '../app/types';

export type CaptureKind = 'audio' | 'video';

/**
 * Returns the devices, among the given ones, for which a request makes the browser show its permission prompt.
 *
 * @param {IReduxState} state - The redux state.
 * @param {CaptureKind[]} kinds - The devices to check.
 * @returns {CaptureKind[]}
 */
export function getKindsToPrompt(state: IReduxState, kinds: CaptureKind[]): CaptureKind[] {
    const { permissionStatus } = state['features/base/devices'];

    return kinds.filter(kind => permissionStatus?.[kind]?.state === 'prompt');
}

/**
 * Returns the browser's capability element for the given devices ({@code <microphone>}, {@code <camera>} or
 * {@code <usermedia>} for both), which shows the permission prompt next to the element and lets the user undo an
 * earlier block.
 *
 * @param {CaptureKind[]} kinds - The devices to ask for.
 * @returns {string|undefined} - The element's tag name, undefined when the browser doesn't support it.
 */
export function getCaptureElement(kinds: CaptureKind[]): 'camera' | 'microphone' | 'usermedia' | undefined {
    if (kinds.length > 1) {
        return 'HTMLUserMediaElement' in window ? 'usermedia' : undefined;
    }
    if (kinds[0] === 'audio') {
        return 'HTMLMicrophoneElement' in window ? 'microphone' : undefined;
    }

    return 'HTMLCameraElement' in window ? 'camera' : undefined;
}
