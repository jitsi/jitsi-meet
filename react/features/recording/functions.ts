import { IReduxState } from '../app/types';
import { isMobileBrowser } from '../base/environment/utils';
import { isJwtFeatureEnabled } from '../base/jwt/functions';
import { JitsiRecordingConstants, browser } from '../base/lib-jitsi-meet';
import {
    getLocalParticipant,
    getRemoteParticipants,
    isLocalParticipantModerator
} from '../base/participants/functions';
import { isInBreakoutRoom } from '../breakout-rooms/functions';
import { isEnabled as isDropboxEnabled } from '../dropbox/functions';
import { extractFqnFromPath } from '../dynamic-branding/functions.any';

import LocalRecordingManager from './components/Recording/LocalRecordingManager';
import { RECORDING_STATUS_PRIORITIES, RECORDING_TYPES } from './constants';
import logger from './logger';

/**
 * Searches in the passed in redux state for an active recording session of the
 * passed in mode.
 *
 * @param {Object} state - The redux state to search in.
 * @param {string} mode - Find an active recording session of the given mode.
 * @returns {Object|undefined}
 */
export function getActiveSession(state: IReduxState, mode: string) {
    const { sessionDatas } = state['features/recording'];
    const { status: statusConstants } = JitsiRecordingConstants;

    return sessionDatas.find(sessionData => sessionData.mode === mode
        && (sessionData.status === statusConstants.ON
            || sessionData.status === statusConstants.PENDING));
}

/**
 * Returns an estimated recording duration based on the size of the video file
 * in MB. The estimate is calculated under the assumption that 1 min of recorded
 * video needs 10MB of storage on average.
 *
 * @param {number} size - The size in MB of the recorded video.
 * @returns {number} - The estimated duration in minutes.
 */
export function getRecordingDurationEstimation(size?: number | null) {
    return Math.floor((size || 0) / 10);
}

/**
 * Searches in the passed in redux state for a recording session that matches
 * the passed in recording session ID.
 *
 * @param {Object} state - The redux state to search in.
 * @param {string} id - The ID of the recording session to find.
 * @returns {Object|undefined}
 */
export function getSessionById(state: IReduxState, id: string) {
    return state['features/recording'].sessionDatas.find(
        sessionData => sessionData.id === id);
}

/**
 * Fetches the recording link from the server.
 *
 * @param {string} url - The base url.
 * @param {string} recordingSessionId - The ID of the recording session to find.
 * @param {string} region - The meeting region.
 * @param {string} tenant - The meeting tenant.
 * @returns {Promise<any>}
 */
export async function getRecordingLink(url: string, recordingSessionId: string, region: string, tenant: string) {
    const fullUrl = `${url}?recordingSessionId=${recordingSessionId}&region=${region}&tenant=${tenant}`;
    const res = await fetch(fullUrl, {
        headers: {
            'Content-Type': 'application/json'
        }
    });
    const json = await res.json();

    return res.ok ? json : Promise.reject(json);
}

/**
 * Selector used for determining if recording is saved on dropbox.
 *
 * @param {Object} state - The redux state to search in.
 * @returns {string}
 */
export function isSavingRecordingOnDropbox(state: IReduxState) {
    return isDropboxEnabled(state)
        && state['features/recording'].selectedRecordingService === RECORDING_TYPES.DROPBOX;
}

/**
 * Selector used for determining disable state for the meeting highlight button.
 *
 * @param {Object} state - The redux state to search in.
 * @returns {string}
 */
export function isHighlightMeetingMomentDisabled(state: IReduxState) {
    return state['features/recording'].disableHighlightMeetingMoment;
}

/**
 * Returns the recording session status that is to be shown in a label. E.g. If
 * there is a session with the status OFF and one with PENDING, then the PENDING
 * one will be shown, because that is likely more important for the user to see.
 *
 * @param {Object} state - The redux state to search in.
 * @param {string} mode - The recording mode to get status for.
 * @returns {string|undefined}
 */
export function getSessionStatusToShow(state: IReduxState, mode: string): string | undefined {
    const recordingSessions = state['features/recording'].sessionDatas;
    let status;

    if (Array.isArray(recordingSessions)) {
        for (const session of recordingSessions) {
            if (session.mode === mode
                    && (!status
                        || (RECORDING_STATUS_PRIORITIES.indexOf(session.status)
                            > RECORDING_STATUS_PRIORITIES.indexOf(status)))) {
                status = session.status;
            }
        }
    }
    if ((!Array.isArray(recordingSessions) || recordingSessions.length === 0)
        && mode === JitsiRecordingConstants.mode.FILE
        && (LocalRecordingManager.isRecordingLocally() || isRemoteParticipantRecordingLocally(state))) {
        status = JitsiRecordingConstants.status.ON;
    }

    return status;
}

/**
 * Check if local recording is supported.
 *
 * @returns {boolean} - Whether local recording is supported or not.
 */
export function supportsLocalRecording() {
    return browser.isChromiumBased() && !browser.isElectron() && !isMobileBrowser()
        && navigator.product !== 'ReactNative';
}

/**
 * Returns the recording button props.
 *
 * @param {Object} state - The redux state to search in.
 *
 * @returns {{
 *    disabled: boolean,
 *    tooltip: string,
 *    visible: boolean
 * }}
 */
export function getRecordButtonProps(state: IReduxState) {
    let visible;

    // a button can be disabled/enabled if enableFeaturesBasedOnToken
    // is on or if the livestreaming is running.
    let disabled = false;
    let tooltip = '';

    // If the containing component provides the visible prop, that is one
    // above all, but if not, the button should be autonomus and decide on
    // its own to be visible or not.
    const isModerator = isLocalParticipantModerator(state);
    const {
        recordingService,
        localRecording
    } = state['features/base/config'];
    const localRecordingEnabled = !localRecording?.disable && supportsLocalRecording();

    const dropboxEnabled = isDropboxEnabled(state);
    const recordingEnabled = recordingService?.enabled || localRecordingEnabled || dropboxEnabled;

    if (isModerator) {
        visible = recordingEnabled ? isJwtFeatureEnabled(state, 'recording', true) : false;
    } else {
        visible = navigator.product !== 'ReactNative' && localRecordingEnabled;
    }

    // disable the button if the livestreaming is running.
    if (visible && getActiveSession(state, JitsiRecordingConstants.mode.STREAM)) {
        disabled = true;
        tooltip = 'dialog.recordingDisabledBecauseOfActiveLiveStreamingTooltip';
    }

    // disable the button if we are in a breakout room.
    if (isInBreakoutRoom(state)) {
        disabled = true;
        visible = false;
    }

    return {
        disabled,
        tooltip,
        visible
    };
}

/**
 * Returns the resource id.
 *
 * @param {Object | string} recorder - A participant or it's resource.
 * @returns {string|undefined}
 */
export function getResourceId(recorder: string | { getId: Function; }) {
    if (recorder) {
        return typeof recorder === 'string'
            ? recorder
            : recorder.getId();
    }
}

/**
 * Sends a meeting highlight to backend.
 *
 * @param  {Object} state - Redux state.
 * @returns {boolean} - True if sent, false otherwise.
 */
export async function sendMeetingHighlight(state: IReduxState) {
    const { webhookProxyUrl: url } = state['features/base/config'];
    const { conference } = state['features/base/conference'];
    const { jwt } = state['features/base/jwt'];
    const { connection } = state['features/base/connection'];
    const jid = connection?.getJid();
    const localParticipant = getLocalParticipant(state);

    const headers = {
        ...jwt ? { 'Authorization': `Bearer ${jwt}` } : {},
        'Content-Type': 'application/json'
    };

    const reqBody = {
        meetingFqn: extractFqnFromPath(state),
        sessionId: conference?.getMeetingUniqueId(),
        submitted: Date.now(),
        participantId: localParticipant?.jwtId,
        participantName: localParticipant?.name,
        participantJid: jid
    };

    if (url) {
        try {
            const res = await fetch(`${url}/v2/highlights`, {
                method: 'POST',
                headers,
                body: JSON.stringify(reqBody)
            });

            if (res.ok) {
                return true;
            }
            logger.error('Status error:', res.status);
        } catch (err) {
            logger.error('Could not send request', err);
        }
    }

    return false;
}

/**
 * Whether a remote participant is recording locally or not.
 *
 * @param {Object} state - Redux state.
 * @returns {boolean}
 */
function isRemoteParticipantRecordingLocally(state: IReduxState) {
    const participants = getRemoteParticipants(state);

    // eslint-disable-next-line prefer-const
    for (let value of participants.values()) {
        if (value.localRecording) {
            return true;
        }
    }

    return false;
}
