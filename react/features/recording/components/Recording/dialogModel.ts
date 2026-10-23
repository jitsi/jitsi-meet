import { RECORDING_TYPES } from '../../constants';
import { getRecordingServiceOptions } from '../../functions';

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

    // An explicit choice is kept as long as it is offered. While a recording runs the selection
    // describes the running session and is kept whatever is offered. Otherwise the services
    // offered changed under the selection (config loaded late, a live stream started or stopped)
    // and the default takes over, so the selector never shows one service while the recording
    // would start on another.
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

        // The deployment asks for it and the transcription could be started on its own right now.
        startsWithRecording: facts.autoTranscribeOnRecord && !facts.transcriptionRunning && !transcriptionStartBlocker,
        visible: facts.canTranscribe || facts.transcriptionRunning
    };

    const footer: IRecordingDialogModel['footer'] = {
        showStartBoth: !recording.running || !transcription.running,
        showStopBoth: recording.running || transcription.running,

        // Start both starts whichever service is not running, so whatever blocks that blocks it.
        startBothBlocker: transcription.startBlocker ?? (recording.running ? undefined : recording.startBlocker),
        visible: recording.visible && transcription.visible
    };

    return {
        footer,
        recording,
        transcription
    };
}
