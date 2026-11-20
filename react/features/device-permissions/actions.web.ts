import { batch } from 'react-redux';

import { IReduxState, IStore } from '../app/types';
import { notifyCameraError, notifyMicError } from '../base/devices/actions.web';
import { openDialog } from '../base/dialog/actions';
import { isDialogOpen } from '../base/dialog/functions';
import { isMobileBrowser } from '../base/environment/utils';
import { JitsiTrackErrors } from '../base/lib-jitsi-meet';
import { createLocalTracksA } from '../base/tracks/actions.any';
import { getLocalTrack } from '../base/tracks/functions.any';
import { createLocalTracksF } from '../base/tracks/functions.web';
import { setDeviceStatusOk } from '../prejoin/actions.web';
import { isPrejoinPageVisible } from '../prejoin/functions';
import { setVideoSettingsVisibility } from '../settings/actions.web';
import { isToolboxVisible } from '../toolbox/functions.web';

import { SET_VIDEO_PERMISSION_PROMPT } from './actionTypes';
import PermissionBlockedDialog from './components/web/PermissionBlockedDialog';
import PermissionPromptDialog from './components/web/PermissionPromptDialog';
import { CaptureKind, getKindsToPrompt, shouldShowGuidance } from './functions';
import logger from './logger';
import { IDevicePermissionsState } from './reducer';

// A new key for every dialog and camera explanation, so that one shown while the previous one closes isn't reused with
// its state.
let dialogKey = 0;

// The ended tracks already dealt with, the permission and the end of a track are reported separately.
const endedTracks = new WeakSet();

// The devices that the pre-join warnings about the access are about.
const PERMISSION_WARNINGS: { [key: string]: CaptureKind[]; } = {
    'prejoin.errorNoCameraPermission': [ 'video' ],
    'prejoin.errorNoMicPermission': [ 'audio' ],
    'prejoin.errorNoPermissions': [ 'audio', 'video' ]
};

/**
 * Whether the camera button is on screen with its settings popover, which can then hold the explanation.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {boolean}
 */
function canAnchorToCameraButton(state: IReduxState) {
    return !isMobileBrowser()
        && !state['features/base/responsive-ui'].isNarrowLayout
        && !isPrejoinPageVisible(state)
        && isToolboxVisible(state)

        // The camera button has the settings popover only in the main toolbar, not in the overflow menu.
        && Boolean(document.querySelector('.video-preview'));
}

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

        const otherKind: CaptureKind = toPrompt[0] === 'audio' ? 'video' : 'audio';
        const offerOtherKind = whenUnmuting && toPrompt.length === 1 && getKindsToPrompt(state, [ otherKind ]).length;
        const props = {
            kinds: toPrompt,
            otherKind: offerOtherKind ? otherKind : undefined
        };

        const { videoPrompt } = state['features/device-permissions'];

        // A request made while the camera request is still explained replaces it.
        if (videoPrompt) {
            videoPrompt.onDone(false);
            dispatch(hideVideoPermissionPrompt());
        }

        return new Promise<boolean>(resolve => {
            if (whenUnmuting && toPrompt.length === 1 && toPrompt[0] === 'video' && canAnchorToCameraButton(state)) {
                batch(() => {
                    dispatch(setVideoPermissionPrompt({
                        ...props,
                        id: ++dialogKey,
                        onDone: resolve
                    }));
                    dispatch(setVideoSettingsVisibility(true));
                });

                return;
            }

            dispatch(openDialog('PermissionPromptDialog', PermissionPromptDialog, {
                ...props,
                key: ++dialogKey,
                onDone: resolve,
                whenUnmuting
            }));
        }).then(allowed => allowed ? kinds : kinds.filter(kind => !toPrompt.includes(kind)));
    };
}

/**
 * Deals with a camera or mic track that the browser ended, so that the device doesn't stay on with no media. When
 * access was blocked or reset in the browser, the device is turned off. Otherwise, e.g. when it was blocked in the OS
 * or by a browser that doesn't report it, or the device failed, the device is requested again and the error tells
 * which.
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
        await useTrack(track);
    };
}

/**
 * Hides the explanation shown above the camera button, together with the popover holding it.
 *
 * @returns {Function}
 */
export function hideVideoPermissionPrompt() {
    return (dispatch: IStore['dispatch']) => {
        // In one go, the camera settings would otherwise open previews of every camera in between.
        batch(() => {
            dispatch(setVideoSettingsVisibility(false));
            dispatch(setVideoPermissionPrompt());
        });
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
        const warned = PERMISSION_WARNINGS[state['features/prejoin'].deviceStatusText];

        // Only a warning about the access, which goes once every device it is about works.
        if (isPrejoinPageVisible(state)
                && warned?.every(kind => getLocalTrack(state['features/base/tracks'], kind)?.jitsiTrack)) {
            dispatch(setDeviceStatusOk('prejoin.lookGood'));
        }
    };
}

/**
 * Sets the explanation of the camera request shown above the camera button.
 *
 * @param {Object} [prompt] - The explanation, none to hide it.
 * @returns {Object}
 */
export function setVideoPermissionPrompt(prompt?: IDevicePermissionsState['videoPrompt']) {
    return {
        prompt,
        type: SET_VIDEO_PERMISSION_PROMPT
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
