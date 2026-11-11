import { IStore } from '../app/types';
import { notifyCameraError, notifyMicError } from '../base/devices/actions.web';
import { openDialog } from '../base/dialog/actions';
import { isDialogOpen } from '../base/dialog/functions';
import { JitsiTrackErrors } from '../base/lib-jitsi-meet';
import { createLocalTracksA } from '../base/tracks/actions.any';
import { getLocalTrack } from '../base/tracks/functions.any';
import { createLocalTracksF } from '../base/tracks/functions.web';
import { setDeviceStatusOk } from '../prejoin/actions.web';
import { isPrejoinPageVisible } from '../prejoin/functions';

import PermissionBlockedDialog from './components/web/PermissionBlockedDialog';
import PermissionPromptDialog from './components/web/PermissionPromptDialog';
import { CaptureKind, getKindsToPrompt, shouldShowGuidance } from './functions';
import logger from './logger';

// A new key for every dialog, so that one opened while the previous one fades out isn't reused with its state.
let dialogKey = 0;

// The ended tracks already dealt with, the permission and the end of a track are reported separately.
const endedTracks = new WeakSet();

// When each track that replaced an ended one was created.
const retriedAt = new WeakMap<object, number>();

// A device whose new track ends this soon as well isn't requested again, it keeps failing.
const RETRY_INTERVAL = 10000;

/**
 * Explains why the devices are needed before the browser asks for access to them.
 *
 * @param {CaptureKind[]} kinds - The devices about to be requested.
 * @param {boolean} [whenUnmuting] - Whether the user is unmuting one device, in which case the dialog also offers
 * access to the other one.
 * @returns {Function} - Resolves with the devices to request: all of them, or when the user declines, the ones the
 * browser doesn't prompt for.
 */
export function explainBeforePrompt(kinds: CaptureKind[], whenUnmuting = false) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']): Promise<CaptureKind[]> => {
        const state = getState();
        const toPrompt = getKindsToPrompt(state, kinds);

        // The reduced UI shows no dialogs.
        if (!toPrompt.length || state['features/base/config'].disablePermissionPromptDialog
                || state['features/base/responsive-ui'].reducedUI) {
            return Promise.resolve(kinds);
        }

        const otherKind = toPrompt[0] === 'audio' ? 'video' : 'audio';
        const offerOtherKind = whenUnmuting && toPrompt.length === 1 && getKindsToPrompt(state, [ otherKind ]).length;

        return new Promise<boolean>(resolve => {
            dispatch(openDialog('PermissionPromptDialog', PermissionPromptDialog, {
                key: ++dialogKey,
                kinds: toPrompt,
                onDone: resolve,
                otherKind: offerOtherKind ? otherKind : undefined,
                whenUnmuting
            }));
        }).then(allowed => allowed ? kinds : kinds.filter(kind => !toPrompt.includes(kind)));
    };
}

/**
 * Guides the user through unblocking the devices after the requests for them were denied.
 *
 * @param {CaptureKind[]} kinds - The devices whose requests failed.
 * @returns {Function}
 */
export function showPermissionGuidance(kinds: CaptureKind[]) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();
        let blocked = kinds.filter(kind => shouldShowGuidance(state, kind));

        // Each device fails on its own, so add it to the guidance already shown.
        if (isDialogOpen(state, PermissionBlockedDialog)) {
            const { componentProps } = state['features/base/dialog'];
            const shown = (componentProps as { kinds?: CaptureKind[]; } | undefined)?.kinds ?? [];

            if (blocked.every(kind => shown.includes(kind))) {
                return;
            }
            blocked = ([ 'audio', 'video' ] as CaptureKind[]).filter(kind => shown.includes(kind) || blocked.includes(kind));
        }

        if (!blocked.length) {
            return;
        }

        dispatch(openDialog('PermissionBlockedDialog', PermissionBlockedDialog, {
            key: ++dialogKey,
            kinds: blocked,
            onRetry: () => dispatch(retryDevices(blocked))
        }));
    };
}

/**
 * Deals with a camera or mic track that the browser ended, so that the device doesn't stay on with no media. When
 * access was blocked or reset in the browser, the device is turned off. Otherwise, e.g. when it was blocked in the OS
 * or by a browser that doesn't report it, or the device failed, the device is requested again and the error tells
 * which, unless its new track ended soon as well.
 *
 * @param {Object} jitsiTrack - The ended track.
 * @returns {Function}
 */
export function handleEndedTrack(jitsiTrack: any) {
    return async (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const kind: CaptureKind = jitsiTrack.getType();
        const isCurrent = () => getLocalTrack(getState()['features/base/tracks'], kind)?.jitsiTrack === jitsiTrack;
        const notifyError = (error: Error) => dispatch(kind === 'audio' ? notifyMicError(error) : notifyCameraError(error));
        const useTrack = (track: any): Promise<void> => (kind === 'audio'
            ? APP.conference.useAudioStream(track) : APP.conference.useVideoStream(track))
            .catch((error: Error) => {
                logger.error(`Failed to replace the ended ${kind} track`, error);
                track?.dispose();
                notifyError(error);
            });

        if (endedTracks.has(jitsiTrack) || !isCurrent()) {
            return;
        }
        endedTracks.add(jitsiTrack);

        const { availableDevices, permissionStatus } = getState()['features/base/devices'];
        const { state } = permissionStatus[kind] ?? {};

        // A muted device is requested again when it is turned on.
        if (state === 'denied' || state === 'prompt' || getState()['features/base/media'][kind].muted) {
            logger.info(`The ${kind} track ended, permission: ${state}`);
            await useTrack(null);

            // Guides the user through unblocking it, or warns where the guidance is turned off.
            state === 'denied' && notifyError({
                message: '',
                name: JitsiTrackErrors.PERMISSION_DENIED
            });

            return;
        }

        // An unplugged device is replaced when the device list changes.
        const devices = (kind === 'audio' ? availableDevices.audioInput : availableDevices.videoInput) ?? [];
        const deviceId = jitsiTrack.getDeviceId();

        if (deviceId && devices.some(d => d.deviceId) && !devices.some(d => d.deviceId === deviceId)) {
            return;
        }

        if (Date.now() - (retriedAt.get(jitsiTrack) ?? 0) < RETRY_INTERVAL) {
            logger.warn(`The ${kind} track ended again soon after the device was requested`);
            await useTrack(null);
            notifyError({
                message: '',
                name: JitsiTrackErrors.GENERAL
            });

            return;
        }

        let track;

        try {
            [ track ] = await createLocalTracksF({ devices: [ kind ] });
        } catch (error: any) {
            logger.warn(`The ${kind} track ended and the device can't be used again`, error);
            notifyError(error);
            isCurrent() && await useTrack(null);

            return;
        }

        if (!isCurrent()) {
            await track.dispose();

            return;
        }

        logger.info(`The ${kind} track ended, using the device again`);
        retriedAt.set(track, Date.now());
        await useTrack(track);
    };
}

/**
 * Leaves the end of a track to the code that stops it on purpose, e.g. to switch to another camera.
 *
 * @param {Object} jitsiTrack - The track about to be stopped.
 * @returns {void}
 */
export function ignoreTrackEnd(jitsiTrack: any) {
    endedTracks.add(jitsiTrack);
}

/**
 * Requests the devices again, after the user unblocked them.
 *
 * @param {CaptureKind[]} kinds - The devices.
 * @returns {Function}
 */
export function retryDevices(kinds: CaptureKind[]) {
    return async (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        // Including the ones a request is still creating.
        const missing = kinds.filter(kind => !getLocalTrack(getState()['features/base/tracks'], kind, true));

        if (!missing.length) {
            return;
        }

        await dispatch(createLocalTracksA({ devices: missing }));

        const state = getState();

        if (isPrejoinPageVisible(state)
                && missing.every(kind => getLocalTrack(state['features/base/tracks'], kind)?.jitsiTrack)) {
            dispatch(setDeviceStatusOk('prejoin.lookGood'));
        }
    };
}
