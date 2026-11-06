import i18next from 'i18next';

import { IReduxState, IStore } from '../app/types';
import { MEET_FEATURES } from '../base/jwt/constants';
import { isJwtFeatureEnabled } from '../base/jwt/functions';
import { JitsiRecordingConstants } from '../base/lib-jitsi-meet';
import { getSoundFileSrc } from '../base/media/functions';
import { getLocalParticipant, getRemoteParticipants } from '../base/participants/functions';
import { registerSound, unregisterSound } from '../base/sounds/actions';
import { isEmbedded, isEmbeddedFromSameDomain } from '../base/util/embedUtils';
import { isSpotTV } from '../base/util/spot';
import { isInBreakoutRoom as isInBreakoutRoomF } from '../breakout-rooms/functions';
import { isEnabled as isDropboxEnabled } from '../dropbox/functions';
import { extractFqnFromPath } from '../dynamic-branding/functions.any';
import { isE2EEOnInMeeting } from '../e2ee/functions';
import { isVpaasMeeting } from '../jaas/functions';
import { canAddTranscriber, isRecorderTranscriptionsRunning, isTranscribing } from '../transcribing/functions';
import { iAmVisitor } from '../visitors/functions';

import LocalRecordingManager from './components/Recording/LocalRecordingManager';
import {
    LIVE_STREAMING_OFF_SOUND_ID,
    LIVE_STREAMING_ON_SOUND_ID,
    RECORDING_AND_TRANSCRIPTION_OFF_SOUND_ID,
    RECORDING_AND_TRANSCRIPTION_ON_SOUND_ID,
    RECORDING_OFF_SOUND_ID,
    RECORDING_ON_SOUND_ID,
    RECORDING_STATUS_PRIORITIES,
    RECORDING_TYPES,
    TRANSCRIPTION_OFF_SOUND_ID,
    TRANSCRIPTION_ON_SOUND_ID
} from './constants';
import logger from './logger';
import {
    LIVE_STREAMING_OFF_SOUND_FILE,
    LIVE_STREAMING_ON_SOUND_FILE,
    RECORDING_AND_TRANSCRIPTION_OFF_SOUND_FILE,
    RECORDING_AND_TRANSCRIPTION_ON_SOUND_FILE,
    RECORDING_OFF_SOUND_FILE,
    RECORDING_ON_SOUND_FILE,
    TRANSCRIPTION_OFF_SOUND_FILE,
    TRANSCRIPTION_ON_SOUND_FILE
} from './sounds';

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
    if (mode === JitsiRecordingConstants.mode.FILE
            && (state['features/recording'].localRecordingRunning || isRemoteParticipantRecordingLocally(state))) {
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
    return LocalRecordingManager.isSupported() && (!isEmbedded() || isEmbeddedFromSameDomain());
}

/**
 * Returns the list of recording services (RECORDING_TYPES values) the participant can currently
 * pick from, in the order they are displayed. Shared by the recording dialog, which preselects one
 * of them, and its content, which renders them, so the two can never disagree.
 *
 * Cloud based services (Jitsi recording service, Dropbox) require the recording JWT feature and are
 * unavailable while a live stream runs (both use Jibri). Dropbox is additionally unavailable while a
 * session is running (integrationsEnabled covers that).
 *
 * @param {Object} options - The availability of each service.
 * @param {boolean} options.fileRecordingsServiceEnabled - Whether the file recordings service is enabled.
 * @param {boolean} options.integrationsEnabled - Whether the third party integrations (Dropbox) are enabled.
 * @param {boolean} options.liveStreamRunning - Whether a live stream is currently running.
 * @param {boolean} options.localRecordingAvailable - Whether local recording is enabled and supported.
 * @param {boolean} options.recordingFeatureEnabled - Whether the recording JWT feature is enabled.
 * @returns {Array<string>}
 */
export function getRecordingServiceOptions({
    fileRecordingsServiceEnabled,
    integrationsEnabled,
    liveStreamRunning,
    localRecordingAvailable,
    recordingFeatureEnabled
}: {
    fileRecordingsServiceEnabled: boolean;
    integrationsEnabled: boolean;
    liveStreamRunning: boolean;
    localRecordingAvailable: boolean;
    recordingFeatureEnabled: boolean;
}): Array<string> {
    const options = [];

    if (recordingFeatureEnabled && !liveStreamRunning) {
        if (fileRecordingsServiceEnabled) {
            options.push(RECORDING_TYPES.JITSI_REC_SERVICE);
        }
        if (integrationsEnabled) {
            options.push(RECORDING_TYPES.DROPBOX);
        }
    }
    if (localRecordingAvailable) {
        options.push(RECORDING_TYPES.LOCAL);
    }

    return options;
}

/**
 * Returns whether this participant asks for a file recording right now: one is on, or one it
 * requested has not started yet, and it has not stopped it since. This is what the local participant
 * knows of its own doing, unlike the local copy of the room metadata, which only reflects a write
 * once the server has echoed it back.
 *
 * @param {IReduxState} state - The redux state to search in.
 * @returns {boolean}
 */
export function isFileRecordingRequested(state: IReduxState) {
    const { startRecordingIntent, stopRecordingIntent } = state['features/recording'];

    if (stopRecordingIntent?.recording) {
        return false;
    }

    return isCloudRecordingRunning(state)
        || Boolean(startRecordingIntent?.recording && !startRecordingIntent.recordingStarted);
}

/**
 * Returns true if there is a cloud recording running.
 *
 * @param {IReduxState} state - The redux state to search in.
 * @returns {boolean}
 */
export function isCloudRecordingRunning(state: IReduxState) {
    return Boolean(getActiveSession(state, JitsiRecordingConstants.mode.FILE));
}

/**
 * Returns true if there is a live streaming running.
 *
 * @param {IReduxState} state - The redux state to search in.
 * @returns {boolean}
 */
export function isLiveStreamingRunning(state: IReduxState) {
    return Boolean(getActiveSession(state, JitsiRecordingConstants.mode.STREAM));
}

/**
 * Returns true if there is a recording session running.
 *
 * @param {Object} state - The redux state to search in.
 * @returns {boolean}
 */
export function isRecordingRunning(state: IReduxState) {
    return (
        isCloudRecordingRunning(state)
        || Boolean(state['features/recording'].localRecordingRunning)
    );
}

/**
 * Returns true if the participant has either the recording or transcription JWT feature enabled.
 * Used to determine if the user can interact with recording/transcription controls.
 *
 * @param {Object} state - The redux state to search in.
 * @returns {boolean}
 */
export function hasRecordingOrTranscriptionFeature(state: IReduxState) {
    return isJwtFeatureEnabled(state, MEET_FEATURES.RECORDING, false)
        || isJwtFeatureEnabled(state, MEET_FEATURES.TRANSCRIPTION, false);
}

/**
 * Returns true if the participant can stop recording.
 *
 * @param {Object} state - The redux state to search in.
 * @returns {boolean}
 */
export function canStopRecording(state: IReduxState) {
    if (state['features/recording'].localRecordingRunning) {
        return true;
    }

    if (isCloudRecordingRunning(state) || isRecorderTranscriptionsRunning(state)) {
        return hasRecordingOrTranscriptionFeature(state);
    }

    return false;
}

/**
 * Returns whether the transcription should start automatically along with a recording started now:
 * the deployment asks for it, the participant can start it, and no transcriber is in the meeting
 * yet. A transcriber already present, for the subtitles or for a running transcription, cannot be
 * started again, so only the recording starts then.
 *
 * @param {Object} state - The redux state to search in.
 * @returns {boolean}
 */
export function shouldAutoTranscribeOnRecord(state: IReduxState) {
    const { transcription } = state['features/base/config'];

    return (transcription?.autoTranscribeOnRecord ?? true)
        && canAddTranscriber(state)
        && !isE2EEOnInMeeting(state)
        && !isTranscribing(state);
}

/**
 * Returns whether the recording should be shared.
 *
 * @param {Object} state - The redux state to search in.
 * @returns {boolean}
 */
export function isRecordingSharingEnabled(state: IReduxState) {
    const { recordingService } = state['features/base/config'];

    return recordingService?.sharingEnabled ?? false;
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
    const tooltip = isRecordingRunning(state) ? 'dialog.stopRecording' : 'dialog.startRecording';

    // If the containing component provides the visible prop, that is one
    // above all, but if not, the button should be autonomus and decide on
    // its own to be visible or not.
    const {
        recordingService,
        localRecording,
        transcription
    } = state['features/base/config'];
    const localRecordingEnabled = !localRecording?.disable && supportsLocalRecording();

    const dropboxEnabled = isDropboxEnabled(state);
    const recordingEnabled = recordingService?.enabled || dropboxEnabled;
    const transcriptionEnabled = transcription?.enabled;

    if (localRecordingEnabled) {
        visible = true;
    } else if (isJwtFeatureEnabled(state, MEET_FEATURES.RECORDING, false)) {
        visible = recordingEnabled;
    } else if (isJwtFeatureEnabled(state, MEET_FEATURES.TRANSCRIPTION, false)) {
        visible = transcriptionEnabled;
    } else if (!isVpaasMeeting(state)) {
        // Self-hosted without JWT: fall back to server config so moderators
        // see the button when recordingService.enabled or transcription.enabled.
        visible = recordingEnabled || transcriptionEnabled;
    }

    // disable the button if we are in a breakout room.
    if (isInBreakoutRoomF(state)) {
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
export function isRemoteParticipantRecordingLocally(state: IReduxState) {
    const participants = getRemoteParticipants(state);

    // eslint-disable-next-line prefer-const
    for (let value of participants.values()) {
        if (value.localRecording) {
            return true;
        }
    }

    return false;
}

/**
 * Unregisters the audio files based on locale.
 *
 * @param {Dispatch<any>} dispatch - The redux dispatch function.
 * @returns {void}
 */
export function unregisterRecordingAudioFiles(dispatch: IStore['dispatch']) {
    dispatch(unregisterSound(LIVE_STREAMING_OFF_SOUND_FILE));
    dispatch(unregisterSound(LIVE_STREAMING_ON_SOUND_FILE));
    dispatch(unregisterSound(RECORDING_OFF_SOUND_FILE));
    dispatch(unregisterSound(RECORDING_ON_SOUND_FILE));
    dispatch(unregisterSound(TRANSCRIPTION_OFF_SOUND_FILE));
    dispatch(unregisterSound(TRANSCRIPTION_ON_SOUND_FILE));
    dispatch(unregisterSound(RECORDING_AND_TRANSCRIPTION_OFF_SOUND_FILE));
    dispatch(unregisterSound(RECORDING_AND_TRANSCRIPTION_ON_SOUND_FILE));
}

/**
 * Registers the audio files based on locale.
 *
 * @param {Dispatch<any>} dispatch - The redux dispatch function.
 * @param {boolean|undefined} shouldUnregister - Whether the sounds should be unregistered.
 * @returns {void}
 */
export function registerRecordingAudioFiles(dispatch: IStore['dispatch'], shouldUnregister?: boolean) {
    const language = i18next.language;

    if (shouldUnregister) {
        unregisterRecordingAudioFiles(dispatch);
    }

    dispatch(registerSound(
        LIVE_STREAMING_OFF_SOUND_ID,
        getSoundFileSrc(LIVE_STREAMING_OFF_SOUND_FILE, language)));

    dispatch(registerSound(
        LIVE_STREAMING_ON_SOUND_ID,
        getSoundFileSrc(LIVE_STREAMING_ON_SOUND_FILE, language)));

    dispatch(registerSound(
        RECORDING_OFF_SOUND_ID,
        getSoundFileSrc(RECORDING_OFF_SOUND_FILE, language)));

    dispatch(registerSound(
        RECORDING_ON_SOUND_ID,
        getSoundFileSrc(RECORDING_ON_SOUND_FILE, language)));

    dispatch(registerSound(
        TRANSCRIPTION_OFF_SOUND_ID,
        getSoundFileSrc(TRANSCRIPTION_OFF_SOUND_FILE, language)));

    dispatch(registerSound(
        TRANSCRIPTION_ON_SOUND_ID,
        getSoundFileSrc(TRANSCRIPTION_ON_SOUND_FILE, language)));

    dispatch(registerSound(
        RECORDING_AND_TRANSCRIPTION_OFF_SOUND_ID,
        getSoundFileSrc(RECORDING_AND_TRANSCRIPTION_OFF_SOUND_FILE, language)));

    dispatch(registerSound(
        RECORDING_AND_TRANSCRIPTION_ON_SOUND_ID,
        getSoundFileSrc(RECORDING_AND_TRANSCRIPTION_ON_SOUND_FILE, language)));
}

/**
 * Returns true if the live-streaming button should be visible.
 *
 * @param {boolean} liveStreamingEnabled - True if the live-streaming is enabled.
 * @param {boolean} liveStreamingAllowed - True if the live-streaming feature is enabled in JWT
 *                                         or is a moderator if JWT is missing or features are missing in JWT.
 * @param {boolean} isInBreakoutRoom - True if in breakout room.
 * @returns {boolean}
 */
export function isLiveStreamingButtonVisible({
    liveStreamingAllowed,
    liveStreamingEnabled,
    isInBreakoutRoom
}: {
    isInBreakoutRoom: boolean;
    liveStreamingAllowed: boolean;
    liveStreamingEnabled: boolean;
}) {
    return !isInBreakoutRoom && liveStreamingEnabled && liveStreamingAllowed;
}

/**
 * Whether the RecordingConsentDialog should be displayed.
 *
 * @param {any} recorderSession - The recorder session.
 * @param {IReduxState} state - The Redux state.
 * @returns {boolean}
 */
export function shouldRequireRecordingConsent(recorderSession: any, state: IReduxState) {
    const { requireRecordingConsent, skipRecordingConsentInMeeting }
        = state['features/dynamic-branding'] || {};
    const { conference } = state['features/base/conference'] || {};
    const { requireConsent, skipConsentInMeeting } = state['features/base/config'].recordings || {};
    const _iAmVisitor = iAmVisitor(state);
    const { iAmRecorder, testing: { showSpotConsentDialog = false } = {} } = state['features/base/config'];
    const { consentRequested } = state['features/recording'];

    if (iAmRecorder || _iAmVisitor) {
        return false;
    }

    // For Spot TV instances, check the showSpotConsentDialog config parameter
    // If showSpotConsentDialog is false (or undefined, defaulting to false), don't show consent dialog
    if (isSpotTV(state) && !showSpotConsentDialog) {
        return false;
    }

    if (!requireConsent && !requireRecordingConsent) {
        return false;
    }

    if (consentRequested.has(recorderSession.getID())) {
        return false;
    }

    // If we join a meeting that has an ongoing recording `conference` will be undefined since
    // we get the recording state through the initial presence which happens in between the
    // WILL_JOIN and JOINED events.
    if (conference && (skipConsentInMeeting || skipRecordingConsentInMeeting)) {
        return false;
    }

    // lib-jitsi-meet may set a JitsiParticipant as the initiator of the recording session or the
    // JID resource in case it cannot find it. We need to handle both cases.
    const initiator = recorderSession.getInitiator();
    const initiatorId = initiator?.getId?.() ?? initiator;

    if (!initiatorId || recorderSession.getStatus() === JitsiRecordingConstants.status.OFF) {
        return false;
    }

    return initiatorId !== getLocalParticipant(state)?.id;
}

/**
 * Why one of the start buttons of the recording & transcription dialog is disabled.
 *
 * - 'noService': no storage service is offered, so no recording can be started.
 * - 'validating': the Dropbox token is being validated.
 * - 'dropboxNotSignedIn': Dropbox is selected without a valid sign-in.
 * - 'e2ee': end-to-end encryption is on; nothing server-side can transcribe the media.
 * - 'transcriberBusy': a transcriber is in the meeting only for the subtitles; a recorder
 *   transcription cannot be started on top of it.
 */
export type StartBlocker = 'dropboxNotSignedIn' | 'e2ee' | 'noService' | 'transcriberBusy' | 'validating';

/**
 * The translation keys explaining a blocker to the user. A blocker without one disables the button
 * silently.
 */
export const START_BLOCKER_REASON_KEYS: Partial<Record<StartBlocker, string>> = {
    e2ee: 'transcribing.unavailableWithE2EE',
    transcriberBusy: 'recording.transcriptionAlreadyOn'
};

/**
 * The order in which the offered storage services are preselected.
 */
const DEFAULT_SERVICE_PRIORITY = [
    RECORDING_TYPES.JITSI_REC_SERVICE,
    RECORDING_TYPES.LOCAL,
    RECORDING_TYPES.DROPBOX
];

/**
 * What the dialog knows from the redux state. Plain facts, none of them a UI decision.
 */
export interface IRecordingDialogFacts {

    /**
     * Whether a recording started now should start the transcription along with it.
     */
    autoTranscribeOnRecord: boolean;

    /**
     * Whether the local participant can start the transcription.
     */
    canTranscribe: boolean;

    /**
     * Whether the Dropbox integration is enabled.
     */
    dropboxEnabled: boolean;

    /**
     * Whether anyone in the meeting has end-to-end encryption on.
     */
    e2eeOn: boolean;

    /**
     * Whether the file recordings service is enabled.
     */
    fileRecordingsServiceEnabled: boolean;

    /**
     * Whether the file recordings service can share the recording with the participants.
     */
    fileRecordingsServiceSharingEnabled: boolean;

    /**
     * Whether any moderator has the regular Follow Me feature active.
     */
    followMeActive: boolean;

    /**
     * Whether any moderator has the recorder Follow Me feature active.
     */
    followMeRecorderActive: boolean;

    /**
     * Whether the local participant has the recorder Follow Me setting enabled.
     */
    followMeRecorderEnabled: boolean;

    /**
     * Whether a live stream is running.
     */
    liveStreamRunning: boolean;

    /**
     * Whether local recording is enabled and supported here.
     */
    localRecordingAvailable: boolean;

    /**
     * Whether the local participant is a moderator.
     */
    moderator: boolean;

    /**
     * Whether the recording JWT feature is enabled.
     */
    recordingFeatureEnabled: boolean;

    /**
     * Whether a recording the local participant can control is running.
     */
    recordingRunning: boolean;

    /**
     * Whether a transcriber is in the meeting only for the subtitles.
     */
    transcriberBusy: boolean;

    /**
     * Whether a transcription the local participant can control is running.
     */
    transcriptionRunning: boolean;

    /**
     * Whether the meeting is a vpaas one.
     */
    vpaas: boolean;
}

/**
 * The part of the dialog's own state the decisions depend on.
 */
export interface IRecordingDialogLocalState {

    /**
     * Whether the Dropbox token is valid.
     */
    isTokenValid: boolean;

    /**
     * Whether the Dropbox token is being validated.
     */
    isValidating: boolean;

    /**
     * The storage service picked in the dialog (a RECORDING_TYPES value), or ''.
     */
    selectedRecordingService: string;
}

/**
 * Every decision the dialog and its content render: what is shown, what is running, what can be
 * started and why not.
 */
export interface IRecordingDialogModel {

    /**
     * The buttons acting on both services at once.
     */
    footer: {

        /**
         * Whether the start both button is shown.
         */
        showStartBoth: boolean;

        /**
         * Whether the stop both button is shown.
         */
        showStopBoth: boolean;

        /**
         * Why the start both button is disabled, when it is.
         */
        startBothBlocker?: StartBlocker;

        /**
         * Whether the footer is shown at all.
         */
        visible: boolean;
    };

    /**
     * The audio & video recording section.
     */
    recording: {

        /**
         * The service preselected when nothing offered is selected: the first offered one of
         * {@link DEFAULT_SERVICE_PRIORITY}, or ''.
         */
        defaultService: string;

        /**
         * Whether the recorder Follow Me switch is on.
         */
        followMeRecorderChecked: boolean;

        /**
         * Whether the recorder Follow Me switch is disabled.
         */
        followMeRecorderDisabled: boolean;

        /**
         * Whether the options (storage service and its settings) are locked.
         */
        optionsLocked: boolean;

        /**
         * Whether a recording is running.
         */
        running: boolean;

        /**
         * The storage service the dialog should show and use (a RECORDING_TYPES value), or ''.
         */
        selectedService: string;

        /**
         * The storage services offered (RECORDING_TYPES values), in display order.
         */
        services: Array<string>;

        /**
         * Whether the recording link sharing switch is shown.
         */
        showFileSharing: boolean;

        /**
         * Whether the recorder Follow Me switch is shown.
         */
        showFollowMeRecorder: boolean;

        /**
         * Why the start recording button is disabled, when it is.
         */
        startBlocker?: StartBlocker;

        /**
         * Whether the section is shown at all.
         */
        visible: boolean;
    };

    /**
     * The transcription section.
     */
    transcription: {

        /**
         * Whether a transcription is running.
         */
        running: boolean;

        /**
         * Why the start transcription button is disabled, when it is.
         */
        startBlocker?: StartBlocker;

        /**
         * Whether starting the recording also starts the transcription.
         */
        startsWithRecording: boolean;

        /**
         * Whether the section is shown at all.
         */
        visible: boolean;
    };
}

/**
 * Returns why a recording cannot be started with the selected service, if it cannot.
 *
 * @param {string} selectedService - The selected storage service, or ''.
 * @param {IRecordingDialogLocalState} local - The dialog's own state.
 * @returns {StartBlocker|undefined}
 */
function getStartRecordingBlocker(
        selectedService: string,
        { isTokenValid, isValidating }: IRecordingDialogLocalState): StartBlocker | undefined {
    if (!selectedService) {
        return 'noService';
    }

    if (isValidating) {
        return 'validating';
    }

    if (selectedService === RECORDING_TYPES.DROPBOX && !isTokenValid) {
        return 'dropboxNotSignedIn';
    }

    return undefined;
}

/**
 * Returns why a transcription cannot be started, if it cannot.
 *
 * @param {IRecordingDialogFacts} facts - What the redux state says.
 * @returns {StartBlocker|undefined}
 */
function getStartTranscriptionBlocker({ e2eeOn, transcriberBusy }: IRecordingDialogFacts): StartBlocker | undefined {
    if (e2eeOn) {
        return 'e2ee';
    }

    if (transcriberBusy) {
        return 'transcriberBusy';
    }

    return undefined;
}

/**
 * Computes everything the recording & transcription dialog decides, from the redux facts and the
 * dialog's own state. This is the only place deciding what the dialog shows and what can be
 * started: the dialog applies its selection, the content renders it.
 *
 * @param {IRecordingDialogFacts} facts - What the redux state says.
 * @param {IRecordingDialogLocalState} local - The dialog's own state.
 * @returns {IRecordingDialogModel}
 */
export function getRecordingDialogModel(
        facts: IRecordingDialogFacts,
        local: IRecordingDialogLocalState): IRecordingDialogModel {
    const services = getRecordingServiceOptions({
        fileRecordingsServiceEnabled: facts.fileRecordingsServiceEnabled,

        // Dropbox cannot be picked while a session runs: the recorder is already set up.
        integrationsEnabled: facts.dropboxEnabled && !facts.recordingRunning && !facts.transcriptionRunning,
        liveStreamRunning: facts.liveStreamRunning,
        localRecordingAvailable: facts.localRecordingAvailable,
        recordingFeatureEnabled: facts.recordingFeatureEnabled
    });
    const defaultService = DEFAULT_SERVICE_PRIORITY.find(service => services.includes(service)) ?? '';

    // An explicit choice is kept as long as it is offered. Otherwise the services offered changed
    // under the selection (config loaded late, a live stream started or stopped) and the default
    // takes over, so the selector never shows one service while the recording would start on
    // another. While a recording runs the selection is left alone whatever is offered: the options
    // are locked then and no recording is going to start, so it is only the service whose options
    // are shown, not necessarily the one recording.
    const selectedService = facts.recordingRunning || services.includes(local.selectedRecordingService)
        ? local.selectedRecordingService
        : defaultService;
    const cloudService = selectedService === RECORDING_TYPES.JITSI_REC_SERVICE
        || selectedService === RECORDING_TYPES.DROPBOX;

    const recording: IRecordingDialogModel['recording'] = {
        defaultService,
        followMeRecorderChecked: facts.followMeRecorderEnabled && !facts.followMeRecorderActive,

        // Another moderator has a Follow Me mode active, or the recorder already started and
        // cannot pick up the change.
        followMeRecorderDisabled: facts.followMeActive || facts.followMeRecorderActive || facts.recordingRunning,
        optionsLocked: facts.recordingRunning || local.isValidating,
        running: facts.recordingRunning,
        selectedService,
        services,
        showFileSharing: facts.fileRecordingsServiceEnabled
            && facts.fileRecordingsServiceSharingEnabled
            && !facts.vpaas
            && selectedService === RECORDING_TYPES.JITSI_REC_SERVICE,

        // Only the cloud services spawn a recorder participant that can follow; a local recording
        // records the own view.
        showFollowMeRecorder: facts.moderator && cloudService,
        startBlocker: getStartRecordingBlocker(selectedService, local),
        visible: facts.recordingRunning || services.length > 0
    };

    const transcriptionStartBlocker = getStartTranscriptionBlocker(facts);
    const transcription: IRecordingDialogModel['transcription'] = {
        running: facts.transcriptionRunning,
        startBlocker: transcriptionStartBlocker,

        // shouldAutoTranscribeOnRecord() already answers no while a transcriber is in the meeting
        // or end-to-end encryption is on: it is the one place deciding this.
        startsWithRecording: facts.autoTranscribeOnRecord,
        visible: facts.canTranscribe || facts.transcriptionRunning
    };

    const footer: IRecordingDialogModel['footer'] = {
        showStartBoth: !recording.running || !transcription.running,
        showStopBoth: recording.running || transcription.running,

        // Start both starts whichever service is not running, so only what blocks those blocks it.
        startBothBlocker: (transcription.running ? undefined : transcription.startBlocker)
            ?? (recording.running ? undefined : recording.startBlocker),
        visible: recording.visible && transcription.visible
    };

    return {
        footer,
        recording,
        transcription
    };
}
