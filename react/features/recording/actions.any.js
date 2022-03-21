// @flow

import { getMeetingRegion, getRecordingSharingUrl } from '../base/config';
import JitsiMeetJS, { JitsiRecordingConstants } from '../base/lib-jitsi-meet';
import { getLocalParticipant, getParticipantDisplayName } from '../base/participants';
import { copyText } from '../base/util/helpers';
import { getVpaasTenant, isVpaasMeeting } from '../jaas/functions';
import {
    NOTIFICATION_TIMEOUT_TYPE,
    hideNotification,
    showErrorNotification,
    showNotification,
    showWarningNotification
} from '../notifications';

import {
    CLEAR_RECORDING_SESSIONS,
    RECORDING_SESSION_UPDATED,
    SET_MEETING_HIGHLIGHT_BUTTON_STATE,
    SET_PENDING_RECORDING_NOTIFICATION_UID,
    SET_SELECTED_RECORDING_SERVICE,
    SET_STREAM_KEY
} from './actionTypes';
import { getRecordingLink, getResourceId, isSavingRecordingOnDropbox, sendMeetingHighlight } from './functions';
import logger from './logger';

declare var APP: Object;

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
    return (dispatch: Function, getState: Function) => {
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
    return async (dispatch: Function) => {
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
    return async (dispatch: Function, getState: Function) => {
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
        initiator: Object | string,
        sessionId: string) {
    return async (dispatch: Function, getState: Function) => {
        const state = getState();
        const initiatorId = getResourceId(initiator);
        const participantName = getParticipantDisplayName(state, initiatorId);
        let dialogProps = {
            descriptionKey: participantName ? 'liveStreaming.onBy' : 'liveStreaming.on',
            descriptionArguments: { name: participantName },
            titleKey: 'dialog.liveStreaming'
        };

        if (mode !== JitsiMeetJS.constants.recording.mode.STREAM) {
            const recordingSharingUrl = getRecordingSharingUrl(state);
            const iAmRecordingInitiator = getLocalParticipant(state).id === initiatorId;

            dialogProps = {
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
                    dialogProps.customActionNameKey = [ 'recording.copyLink' ];
                    dialogProps.customActionHandler = [ () => copyText(link) ];
                    dialogProps.titleKey = 'recording.on';
                    dialogProps.descriptionKey = 'recording.linkGenerated';
                } catch (err) {
                    dispatch(showErrorNotification({
                        titleKey: 'recording.errorFetchingLink'
                    }, NOTIFICATION_TIMEOUT_TYPE.MEDIUM));

                    return logger.error('Could not fetch recording link', err);
                }
            }
        }

        dispatch(showNotification(dialogProps, NOTIFICATION_TIMEOUT_TYPE.SHORT));
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
export function updateRecordingSessionData(session: Object) {
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
function _setPendingRecordingNotificationUid(uid: ?number, streamType: string) {
    return {
        type: SET_PENDING_RECORDING_NOTIFICATION_UID,
        streamType,
        uid
    };
}
