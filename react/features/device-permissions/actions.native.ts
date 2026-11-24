import { CaptureKind } from './functions';

/**
 * The permission prompt is explained only on web.
 *
 * @param {CaptureKind[]} kinds - The devices about to be requested.
 * @param {boolean} [_whenUnmuting] - Whether the user is unmuting one device.
 * @returns {Function} - Resolves with the devices to request, all of them.
 */
export function explainBeforePrompt(kinds: CaptureKind[], _whenUnmuting?: boolean) {
    return () => Promise.resolve(kinds);
}
