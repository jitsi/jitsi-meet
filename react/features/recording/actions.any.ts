import { IStore } from '../app/types';
import { getMeetingRegion, getRecordingSharingUrl } from '../base/config/functions';
import { isJwtFeatureEnabled } from '../base/jwt/functions';
import JitsiMeetJS, { JitsiRecordingConstants } from '../base/lib-jitsi-meet';
import {
    getLocalParticipant,
    getParticipantDisplayName,
    isLocalParticipantModerator
} from '../base/participants/functions';
import { BUTTON_TYPES } from '../base/ui/constants.any';
import { copyText } from '../base/util/copyText';
import { getVpaasTenant, isVpaasMeeting } from '../jaas/functions';
import {
    hideNotification,
    showErrorNotification,
    showNotification,
    showWarningNotification
} from '../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE, NOTIFICATION_TYPE } from '../notifications/constants';
import { INotificationProps } from '../notifications/types';
import { setRequestingSubtitles } from '../subtitles/actions.any';

import {
    CLEAR_RECORDING_SESSIONS,
    RECORDING_SESSION_UPDATED,
    SET_MEETING_HIGHLIGHT_BUTTON_STATE,
    SET_PENDING_RECORDING_NOTIFICATION_UID,
    SET_SELECTED_RECORDING_SERVICE,
    SET_STREAM_KEY,
    START_LOCAL_RECORDING,
    STOP_LOCAL_RECORDING
} from './actionTypes';
import { START_RECORDING_NOTIFICATION_ID } from './constants';
import {
    getRecordButtonProps,
    getRecordingLink,
    getResourceId,
    isRecordingRunning,
    isRecordingSharingEnabled,
    isSavingRecordingOnDropbox,
    sendMeetingHighlight,
    shouldAutoTranscribeOnRecord
} from './functions';
import logger from './logger';


/**
 * Clears the data of every recording sessions.
 *
 * @returns {{
 *     type: CLEAR_RECORDING_SESSIONS
 * }}
 */
export function clearRecordingSessions() {
    return {
        type: CLEAR_RECORDING_SESSIONS
    };
}

/**
 * Sets the meeting highlight button disable state.
 *
 * @param {boolean} disabled - The disabled state value.
 * @returns {{
 *     type: CLEAR_RECORDING_SESSIONS
 * }}
 */
export function setHighlightMomentButtonState(disabled: boolean) {
    return {
        type: SET_MEETING_HIGHLIGHT_BUTTON_STATE,
        disabled
    };
}

/**
 * Signals that the pending recording notification should be removed from the
 * screen.
 *
 * @param {string} streamType - The type of the stream ({@code 'file'} or
 * {@code 'stream'}).
 * @returns {Function}
 */
export function hidePendingRecordingNotification(streamType: string) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const { pendingNotificationUids } = getState()['features/recording'];
        const pendingNotificationUid = pendingNotificationUids[streamType];

        if (pendingNotificationUid) {
            dispatch(hideNotification(pendingNotificationUid));
            dispatch(
                _setPendingRecordingNotificationUid(
                    undefined, streamType));
        }
    };
}

/**
 * Sets the stream key last used by the user for later reuse.
 *
 * @param {string} streamKey - The stream key to set.
 * @returns {{
 *     type: SET_STREAM_KEY,
 *     streamKey: string
 * }}
 */
export function setLiveStreamKey(streamKey: string) {
    return {
        type: SET_STREAM_KEY,
        streamKey
    };
}

/**
 * Signals that the pending recording notification should be shown on the
 * screen.
 *
 * @param {string} streamType - The type of the stream ({@code file} or
 * {@code stream}).
 * @returns {Function}
 */
export function showPendingRecordingNotification(streamType: string) {
    return async (dispatch: IStore['dispatch']) => {
        const isLiveStreaming
            = streamType === JitsiMeetJS.constants.recording.mode.STREAM;
        const dialogProps = isLiveStreaming ? {
            descriptionKey: 'liveStreaming.pending',
            titleKey: 'dialog.liveStreaming'
        } : {
            descriptionKey: 'recording.pending',
            titleKey: 'dialog.recording'
        };
        const notification = await dispatch(showNotification({
            ...dialogProps
        }, NOTIFICATION_TIMEOUT_TYPE.MEDIUM));

        if (notification) {
            dispatch(_setPendingRecordingNotificationUid(notification.uid, streamType));
        }
    };
}

/**
 * Highlights a meeting moment.
 *
 * {@code stream}).
 *
 * @returns {Function}
 */
export function highlightMeetingMoment() {
    return async (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        dispatch(setHighlightMomentButtonState(true));

        const success = await sendMeetingHighlight(getState());

        if (success) {
            dispatch(showNotification({
                descriptionKey: 'recording.highlightMomentSucessDescription',
                titleKey: 'recording.highlightMomentSuccess'
            }, NOTIFICATION_TIMEOUT_TYPE.SHORT));
        }

        dispatch(setHighlightMomentButtonState(false));
    };
}

/**
 * Signals that the recording error notification should be shown.
 *
 * @param {Object} props - The Props needed to render the notification.
 * @returns {showErrorNotification}
 */
export function showRecordingError(props: Object) {
    return showErrorNotification(props, NOTIFICATION_TIMEOUT_TYPE.LONG);
}

/**
 * Signals that the recording warning notification should be shown.
 *
 * @param {Object} props - The Props needed to render the notification.
 * @returns {showWarningNotification}
 */
export function showRecordingWarning(props: Object) {
    return showWarningNotification(props);
}

/**
 * Signals that the stopped recording notification should be shown on the
 * screen for a given period.
 *
 * @param {string} streamType - The type of the stream ({@code file} or
 * {@code stream}).
 * @param {string?} participantName - The participant name stopping the recording.
 * @returns {showNotification}
 */
export function showStoppedRecordingNotification(streamType: string, participantName?: string) {
    const isLiveStreaming
        = streamType === JitsiMeetJS.constants.recording.mode.STREAM;
    const descriptionArguments = { name: participantName };
    const dialogProps = isLiveStreaming ? {
        descriptionKey: participantName ? 'liveStreaming.offBy' : 'liveStreaming.off',
        descriptionArguments,
        titleKey: 'dialog.liveStreaming'
    } : {
        descriptionKey: participantName ? 'recording.offBy' : 'recording.off',
        descriptionArguments,
        titleKey: 'dialog.recording'
    };

    return showNotification(dialogProps, NOTIFICATION_TIMEOUT_TYPE.SHORT);
}

/**
 * Signals that a started recording notification should be shown on the
 * screen for a given period.
 *
 * @param {string} mode - The type of the recording: Stream of File.
 * @param {string | Object } initiator - The participant who started recording.
 * @param {string} sessionId - The recording session id.
 * @returns {Function}
 */
export function showStartedRecordingNotification(
        mode: string,
        initiator: { getId: Function; } | string,
        sessionId: string) {
    return async (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();
        const initiatorId = getResourceId(initiator);
        const participantName = getParticipantDisplayName(state, initiatorId);
        const notifyProps: {
            dialogProps: INotificationProps;
            type: string;
        } = {
            dialogProps: {
                descriptionKey: participantName ? 'liveStreaming.onBy' : 'liveStreaming.on',
                descriptionArguments: { name: participantName },
                titleKey: 'dialog.liveStreaming'
            },
            type: NOTIFICATION_TIMEOUT_TYPE.SHORT
        };

        if (mode !== JitsiMeetJS.constants.recording.mode.STREAM) {
            const recordingSharingUrl = getRecordingSharingUrl(state);
            const iAmRecordingInitiator = getLocalParticipant(state)?.id === initiatorId;

            notifyProps.dialogProps = {
                customActionHandler: undefined,
                customActionNameKey: undefined,
                descriptionKey: participantName ? 'recording.onBy' : 'recording.on',
                descriptionArguments: { name: participantName },
                titleKey: 'dialog.recording'
            };

            // fetch the recording link from the server for recording initiators in jaas meetings
            if (recordingSharingUrl
                && isVpaasMeeting(state)
                && iAmRecordingInitiator
                && !isSavingRecordingOnDropbox(state)) {
                const region = getMeetingRegion(state);
                const tenant = getVpaasTenant(state);

                try {
                    const response = await getRecordingLink(recordingSharingUrl, sessionId, region, tenant);
                    const { url: link, urlExpirationTimeMillis: ttl } = response;

                    if (typeof APP === 'object') {
                        APP.API.notifyRecordingLinkAvailable(link, ttl);
                    }

                    // add the option to copy recording link
                    notifyProps.dialogProps = {
                        ...notifyProps.dialogProps,
                        customActionNameKey: [ 'recording.copyLink' ],
                        customActionHandler: [ () => copyText(link) ],
                        titleKey: 'recording.on',
                        descriptionKey: 'recording.linkGenerated'
                    };

                    notifyProps.type = NOTIFICATION_TIMEOUT_TYPE.STICKY;
                } catch (err) {
                    dispatch(showErrorNotification({
                        titleKey: 'recording.errorFetchingLink'
                    }, NOTIFICATION_TIMEOUT_TYPE.MEDIUM));

                    return logger.error('Could not fetch recording link', err);
                }
            }
        }

        dispatch(showNotification(notifyProps.dialogProps, notifyProps.type));
    };
}

/**
 * Updates the known state for a given recording session.
 *
 * @param {Object} session - The new state to merge with the existing state in
 * redux.
 * @returns {{
 *     type: RECORDING_SESSION_UPDATED,
 *     sessionData: Object
 * }}
 */
export function updateRecordingSessionData(session: any) {
    const status = session.getStatus();
    const timestamp
        = status === JitsiRecordingConstants.status.ON
            ? Date.now() / 1000
            : undefined;

    return {
        type: RECORDING_SESSION_UPDATED,
        sessionData: {
            error: session.getError(),
            id: session.getID(),
            initiator: session.getInitiator(),
            liveStreamViewURL: session.getLiveStreamViewURL(),
            mode: session.getMode(),
            status,
            terminator: session.getTerminator(),
            timestamp
        }
    };
}

/**
 * Sets the selected recording service.
 *
 * @param {string} selectedRecordingService - The new selected recording service.
 * @returns {Object}
 */
export function setSelectedRecordingService(selectedRecordingService: string) {
    return {
        type: SET_SELECTED_RECORDING_SERVICE,
        selectedRecordingService
    };
}

/**
 * Sets UID of the the pending streaming notification to use it when hinding
 * the notification is necessary, or unsets it when undefined (or no param) is
 * passed.
 *
 * @param {?number} uid - The UID of the notification.
 * @param {string} streamType - The type of the stream ({@code file} or
 * {@code stream}).
 * @returns {{
 *     type: SET_PENDING_RECORDING_NOTIFICATION_UID,
 *     streamType: string,
 *     uid: number
 * }}
 */
function _setPendingRecordingNotificationUid(uid: string | undefined, streamType: string) {
    return {
        type: SET_PENDING_RECORDING_NOTIFICATION_UID,
        streamType,
        uid
    };
}

/**
 * Starts local recording.
 *
 * @param {boolean} onlySelf - Whether to only record the local streams.
 * @returns {Object}
 */
export function startLocalVideoRecording(onlySelf?: boolean) {
    return {
        type: START_LOCAL_RECORDING,
        onlySelf
    };
}

/**
 * Stops local recording.
 *
 * @returns {Object}
 */
export function stopLocalVideoRecording() {
    return {
        type: STOP_LOCAL_RECORDING
    };
}

/**
 * Displays the notification suggesting to start the recording.
 *
 * @param {Function} openRecordingDialog - The callback to open the recording dialog.
 * @returns {void}
 */
export function showStartRecordingNotificationWithCallback(openRecordingDialog: Function) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();
        const { recordings } = state['features/base/config'];
        const { suggestRecording } = recordings || {};
        const recordButtonProps = getRecordButtonProps(state);
        const isAlreadyRecording = isRecordingRunning(state);

        if (!suggestRecording
            || isAlreadyRecording
            || !recordButtonProps.visible
            || recordButtonProps.disabled) {
            return;
        }

        dispatch(showNotification({
            titleKey: 'notify.suggestRecordingTitle',
            descriptionKey: 'notify.suggestRecordingDescription',
            uid: START_RECORDING_NOTIFICATION_ID,
            customActionType: [ BUTTON_TYPES.PRIMARY ],
            customActionNameKey: [ 'notify.suggestRecordingAction' ],
            customActionHandler: [ () => {
                const isModerator = isLocalParticipantModerator(state);
                const { recordingService } = state['features/base/config'];

                const canBypassDialog = isModerator
                    && recordingService?.enabled
                    && isJwtFeatureEnabled(state, 'recording', true);

                if (canBypassDialog) {
                    const options = {
                        'file_recording_metadata': {
                            share: isRecordingSharingEnabled(state)
                        }
                    };

                    const { conference } = state['features/base/conference'];
                    const autoTranscribeOnRecord = shouldAutoTranscribeOnRecord(state);

                    conference?.startRecording({
                        mode: JitsiRecordingConstants.mode.FILE,
                        appData: JSON.stringify(options)
                    });

                    if (autoTranscribeOnRecord) {
                        dispatch(setRequestingSubtitles(true, false));
                    }
                } else {
                    openRecordingDialog();
                }

                dispatch(hideNotification(START_RECORDING_NOTIFICATION_ID));
            } ],
            appearance: NOTIFICATION_TYPE.NORMAL
        }, NOTIFICATION_TIMEOUT_TYPE.MEDIUM));
    };
}
