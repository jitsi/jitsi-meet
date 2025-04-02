/* global APP */
import Logger from '@jitsi/logger';

import { createApiEvent } from '../../react/features/analytics/AnalyticsEvents';
import { sendAnalytics } from '../../react/features/analytics/functions';
import {
    approveParticipantAudio,
    approveParticipantVideo,
    rejectParticipantAudio,
    rejectParticipantVideo,
    requestDisableAudioModeration,
    requestDisableVideoModeration,
    requestEnableAudioModeration,
    requestEnableVideoModeration
} from '../../react/features/av-moderation/actions';
import { isEnabledFromState } from '../../react/features/av-moderation/functions';
import { setAudioOnly } from '../../react/features/base/audio-only/actions';
import {
    endConference,
    sendTones,
    setAssumedBandwidthBps,
    setFollowMe,
    setFollowMeRecorder,
    setLocalSubject,
    setPassword,
    setSubject
} from '../../react/features/base/conference/actions';
import { getCurrentConference, isP2pActive } from '../../react/features/base/conference/functions';
import { overwriteConfig } from '../../react/features/base/config/actions';
import { getWhitelistedJSON } from '../../react/features/base/config/functions.any';
import { toggleDialog } from '../../react/features/base/dialog/actions';
import { isSupportedBrowser } from '../../react/features/base/environment/environment';
import { parseJWTFromURLParams } from '../../react/features/base/jwt/functions';
import JitsiMeetJS, { JitsiRecordingConstants } from '../../react/features/base/lib-jitsi-meet';
import { MEDIA_TYPE, VIDEO_TYPE } from '../../react/features/base/media/constants';
import { isVideoMutedByUser } from '../../react/features/base/media/functions';
import {
    grantModerator,
    kickParticipant,
    overwriteParticipantsNames,
    pinParticipant,
    raiseHand
} from '../../react/features/base/participants/actions';
import { LOCAL_PARTICIPANT_DEFAULT_ID } from '../../react/features/base/participants/constants';
import {
    getLocalParticipant,
    getNormalizedDisplayName,
    getParticipantById,
    getScreenshareParticipantIds,
    getVirtualScreenshareParticipantByOwnerId,
    hasRaisedHand,
    isLocalParticipantModerator,
    isParticipantModerator
} from '../../react/features/base/participants/functions';
import { updateSettings } from '../../react/features/base/settings/actions';
import { getDisplayName } from '../../react/features/base/settings/functions.web';
import { setCameraFacingMode } from '../../react/features/base/tracks/actions.web';
import { CAMERA_FACING_MODE_MESSAGE } from '../../react/features/base/tracks/constants';
import {
    getLocalVideoTrack,
    isLocalTrackMuted
} from '../../react/features/base/tracks/functions';
import {
    autoAssignToBreakoutRooms,
    closeBreakoutRoom,
    createBreakoutRoom,
    moveToRoom,
    removeBreakoutRoom,
    sendParticipantToRoom
} from '../../react/features/breakout-rooms/actions';
import { getBreakoutRooms, getRoomsInfo } from '../../react/features/breakout-rooms/functions';
import {
    sendMessage,
    setPrivateMessageRecipient,
    toggleChat
} from '../../react/features/chat/actions';
import { openChat } from '../../react/features/chat/actions.web';
import { showDesktopPicker } from '../../react/features/desktop-picker/actions';
import {
    processExternalDeviceRequest
} from '../../react/features/device-selection/functions';
import { appendSuffix } from '../../react/features/display-name/functions';
import { isEnabled as isDropboxEnabled } from '../../react/features/dropbox/functions';
import { setMediaEncryptionKey, toggleE2EE } from '../../react/features/e2ee/actions';
import {
    addStageParticipant,
    resizeFilmStrip,
    setFilmstripVisible,
    setVolume,
    togglePinStageParticipant
} from '../../react/features/filmstrip/actions.web';
import { getPinnedActiveParticipants, isStageFilmstripAvailable } from '../../react/features/filmstrip/functions.web';
import { invite } from '../../react/features/invite/actions.any';
import {
    selectParticipantInLargeVideo
} from '../../react/features/large-video/actions.any';
import {
    captureLargeVideoScreenshot,
    resizeLargeVideo
} from '../../react/features/large-video/actions.web';
import { answerKnockingParticipant, toggleLobbyMode } from '../../react/features/lobby/actions';
import { setNoiseSuppressionEnabled } from '../../react/features/noise-suppression/actions';
import { hideNotification, showNotification } from '../../react/features/notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE, NOTIFICATION_TYPE } from '../../react/features/notifications/constants';
import {
    close as closeParticipantsPane,
    open as openParticipantsPane
} from '../../react/features/participants-pane/actions';
import { getParticipantsPaneOpen, isForceMuted } from '../../react/features/participants-pane/functions';
import { startLocalVideoRecording, stopLocalVideoRecording } from '../../react/features/recording/actions.any';
import { RECORDING_METADATA_ID, RECORDING_TYPES } from '../../react/features/recording/constants';
import { getActiveSession, supportsLocalRecording } from '../../react/features/recording/functions';
import { startAudioScreenShareFlow, startScreenShareFlow } from '../../react/features/screen-share/actions';
import { isScreenAudioSupported } from '../../react/features/screen-share/functions';
import { toggleScreenshotCaptureSummary } from '../../react/features/screenshot-capture/actions';
import { isScreenshotCaptureEnabled } from '../../react/features/screenshot-capture/functions';
import SettingsDialog from '../../react/features/settings/components/web/SettingsDialog';
import { SETTINGS_TABS } from '../../react/features/settings/constants';
import { playSharedVideo, stopSharedVideo } from '../../react/features/shared-video/actions';
import { extractYoutubeIdOrURL } from '../../react/features/shared-video/functions';
import { setRequestingSubtitles, toggleRequestingSubtitles } from '../../react/features/subtitles/actions';
import { isAudioMuteButtonDisabled } from '../../react/features/toolbox/functions';
import { setTileView, toggleTileView } from '../../react/features/video-layout/actions.any';
import { muteAllParticipants } from '../../react/features/video-menu/actions';
import { setVideoQuality } from '../../react/features/video-quality/actions';
import { toggleBackgroundEffect, toggleBlurredBackgroundEffect } from '../../react/features/virtual-background/actions';
import { VIRTUAL_BACKGROUND_TYPE } from '../../react/features/virtual-background/constants';
import { toggleWhiteboard } from '../../react/features/whiteboard/actions.web';
import { getJitsiMeetTransport } from '../transport';

import {
    API_ID,
    ENDPOINT_TEXT_MESSAGE_NAME
} from './constants';

const logger = Logger.getLogger(__filename);

/**
 * List of the available commands.
 */
let commands = {};

/**
 * The transport instance used for communication with external apps.
 *
 * @type {Transport}
 */
const transport = getJitsiMeetTransport();

/**
 * The current audio availability.
 *
 * @type {boolean}
 */
let audioAvailable = true;

/**
 * The current video availability.
 *
 * @type {boolean}
 */
let videoAvailable = true;

/**
 * Initializes supported commands.
 *
 * @returns {void}
 */
function initCommands() {
    commands = {
        'add-breakout-room': name => {
            if (!isLocalParticipantModerator(APP.store.getState())) {
                logger.error('Missing moderator rights to add breakout rooms');

                return;
            }
            APP.store.dispatch(createBreakoutRoom(name));
        },
        'answer-knocking-participant': (id, approved) => {
            APP.store.dispatch(answerKnockingParticipant(id, approved));
        },
        'approve-video': participantId => {
            if (!isLocalParticipantModerator(APP.store.getState())) {
                return;
            }

            APP.store.dispatch(approveParticipantVideo(participantId));
        },
        'ask-to-unmute': participantId => {
            if (!isLocalParticipantModerator(APP.store.getState())) {
                return;
            }

            APP.store.dispatch(approveParticipantAudio(participantId));
        },
        'auto-assign-to-breakout-rooms': () => {
            if (!isLocalParticipantModerator(APP.store.getState())) {
                logger.error('Missing moderator rights to auto-assign participants to breakout rooms');

                return;
            }
            APP.store.dispatch(autoAssignToBreakoutRooms());
        },
        'grant-moderator': participantId => {
            if (!isLocalParticipantModerator(APP.store.getState())) {
                logger.error('Missing moderator rights to grant moderator right to another participant');

                return;
            }
            APP.store.dispatch(grantModerator(participantId));
        },
        'display-name': displayName => {
            sendAnalytics(createApiEvent('display.name.changed'));
            APP.store.dispatch(updateSettings({ displayName: getNormalizedDisplayName(displayName) }));
        },
        'local-subject': localSubject => {
            sendAnalytics(createApiEvent('local.subject.changed'));
            APP.store.dispatch(setLocalSubject(localSubject));
        },
        'mute-everyone': mediaType => {
            const muteMediaType = mediaType ? mediaType : MEDIA_TYPE.AUDIO;

            sendAnalytics(createApiEvent('muted-everyone'));
            const localParticipant = getLocalParticipant(APP.store.getState());
            const exclude = [];

            if (localParticipant && isParticipantModerator(localParticipant)) {
                exclude.push(localParticipant.id);
            }

            APP.store.dispatch(muteAllParticipants(exclude, muteMediaType));
        },
        'toggle-lobby': isLobbyEnabled => {
            APP.store.dispatch(toggleLobbyMode(isLobbyEnabled));
        },
        'password': password => {
            const { conference, passwordRequired }
                = APP.store.getState()['features/base/conference'];

            if (passwordRequired) {
                sendAnalytics(createApiEvent('submit.password'));

                APP.store.dispatch(setPassword(
                    passwordRequired,
                    passwordRequired.join,
                    password
                ));
            } else {
                sendAnalytics(createApiEvent('password.changed'));

                APP.store.dispatch(setPassword(
                    conference,
                    conference.lock,
                    password
                ));
            }
        },
        'pin-participant': (id, videoType) => {
            const state = APP.store.getState();

            // if id not provided, unpin everybody.
            if (!id) {
                if (isStageFilmstripAvailable(state)) {
                    const pinnedParticipants = getPinnedActiveParticipants(state);

                    pinnedParticipants?.forEach(p => {
                        APP.store.dispatch(togglePinStageParticipant(p.participantId));
                    });
                } else {
                    APP.store.dispatch(pinParticipant());
                }

                return;
            }

            const participant = videoType === VIDEO_TYPE.DESKTOP
                ? getVirtualScreenshareParticipantByOwnerId(state, id) : getParticipantById(state, id);

            if (!participant) {
                logger.warn('Trying to pin a non-existing participant with pin-participant command.');

                return;
            }

            sendAnalytics(createApiEvent('participant.pinned'));

            const participantId = participant.id;

            if (isStageFilmstripAvailable(state)) {
                APP.store.dispatch(addStageParticipant(participantId, true));
            } else {
                APP.store.dispatch(pinParticipant(participantId));
            }
        },
        'proxy-connection-event': event => {
            APP.conference.onProxyConnectionEvent(event);
        },
        'reject-participant': (participantId, mediaType) => {
            if (!isLocalParticipantModerator(APP.store.getState())) {
                return;
            }

            const reject = mediaType === MEDIA_TYPE.VIDEO ? rejectParticipantVideo : rejectParticipantAudio;

            APP.store.dispatch(reject(participantId));
        },
        'remove-breakout-room': breakoutRoomJid => {
            if (!isLocalParticipantModerator(APP.store.getState())) {
                logger.error('Missing moderator rights to remove breakout rooms');

                return;
            }
            APP.store.dispatch(removeBreakoutRoom(breakoutRoomJid));
        },
        'resize-large-video': (width, height) => {
            sendAnalytics(createApiEvent('largevideo.resized'));
            APP.store.dispatch(resizeLargeVideo(width, height));
        },
        'send-tones': (options = {}) => {
            const { duration, tones, pause } = options;

            APP.store.dispatch(sendTones(tones, duration, pause));
        },
        'set-assumed-bandwidth-bps': value => {
            logger.debug('Set assumed bandwidth bps command received', value);

            if (typeof value !== 'number' || isNaN(value)) {
                logger.error('Assumed bandwidth bps must be a number.');

                return;
            }

            APP.store.dispatch(setAssumedBandwidthBps(value));
        },
        'set-blurred-background': blurType => {
            const tracks = APP.store.getState()['features/base/tracks'];
            const videoTrack = getLocalVideoTrack(tracks)?.jitsiTrack;
            const muted = tracks ? isLocalTrackMuted(tracks, MEDIA_TYPE.VIDEO) : isVideoMutedByUser(APP.store);

            APP.store.dispatch(toggleBlurredBackgroundEffect(videoTrack, blurType, muted));
        },
        'set-follow-me': (value, recorderOnly) => {

            if (value) {
                sendAnalytics(createApiEvent('follow.me.set', {
                    recorderOnly
                }));
            } else {
                sendAnalytics(createApiEvent('follow.me.unset', {
                    recorderOnly
                }));
            }

            APP.store.dispatch(recorderOnly ? setFollowMeRecorder(value) : setFollowMe(value));
        },
        'set-large-video-participant': (participantId, videoType) => {
            const { getState, dispatch } = APP.store;

            if (!participantId) {
                sendAnalytics(createApiEvent('largevideo.participant.set'));
                dispatch(selectParticipantInLargeVideo());

                return;
            }

            const state = getState();
            const participant = videoType === VIDEO_TYPE.DESKTOP
                ? getVirtualScreenshareParticipantByOwnerId(state, participantId)
                : getParticipantById(state, participantId);

            if (!participant) {
                logger.warn('Trying to select a non-existing participant with set-large-video-participant command.');

                return;
            }

            dispatch(setTileView(false));
            sendAnalytics(createApiEvent('largevideo.participant.set'));
            dispatch(selectParticipantInLargeVideo(participant.id));
        },
        'set-participant-volume': (participantId, volume) => {
            APP.store.dispatch(setVolume(participantId, volume));
        },
        'subject': subject => {
            sendAnalytics(createApiEvent('subject.changed'));
            APP.store.dispatch(setSubject(subject));
        },
        'submit-feedback': feedback => {
            sendAnalytics(createApiEvent('submit.feedback'));
            APP.conference.submitFeedback(feedback.score, feedback.message);
        },
        'toggle-audio': () => {
            sendAnalytics(createApiEvent('toggle-audio'));
            APP.conference.toggleAudioMuted(false /* no UI */);
        },
        'toggle-video': () => {
            sendAnalytics(createApiEvent('toggle-video'));
            APP.conference.toggleVideoMuted(false /* no UI */, true /* ensure track */);
        },
        'toggle-film-strip': () => {
            sendAnalytics(createApiEvent('film.strip.toggled'));
            const { visible } = APP.store.getState()['features/filmstrip'];

            APP.store.dispatch(setFilmstripVisible(!visible));
        },

        /*
         * @param {Object} options - Additional details of how to perform
         * the action.
         * @param {number} options.width - width value for film strip.
         */
        'resize-film-strip': (options = {}) => {
            sendAnalytics(createApiEvent('film.strip.resize'));
            APP.store.dispatch(resizeFilmStrip(options.width));
        },
        'toggle-camera': facingMode => {
            APP.store.dispatch(setCameraFacingMode(facingMode));
        },
        'toggle-camera-mirror': () => {
            const state = APP.store.getState();
            const { localFlipX: currentFlipX } = state['features/base/settings'];

            APP.store.dispatch(updateSettings({ localFlipX: !currentFlipX }));
        },
        'toggle-chat': () => {
            sendAnalytics(createApiEvent('chat.toggled'));
            APP.store.dispatch(toggleChat());
        },
        'toggle-moderation': (enabled, mediaType) => {
            const state = APP.store.getState();

            if (!isLocalParticipantModerator(state)) {
                return;
            }

            const enable = mediaType === MEDIA_TYPE.VIDEO
                ? requestEnableVideoModeration : requestEnableAudioModeration;
            const disable = mediaType === MEDIA_TYPE.VIDEO
                ? requestDisableVideoModeration : requestDisableAudioModeration;

            if (enabled) {
                APP.store.dispatch(enable());
            } else {
                APP.store.dispatch(disable());
            }
        },
        'toggle-participants-pane': enabled => {
            const toggleParticipantsPane = enabled
                ? openParticipantsPane : closeParticipantsPane;

            APP.store.dispatch(toggleParticipantsPane());
        },
        'toggle-raise-hand': () => {
            const localParticipant = getLocalParticipant(APP.store.getState());

            if (!localParticipant) {
                return;
            }
            const raisedHand = hasRaisedHand(localParticipant);

            sendAnalytics(createApiEvent('raise-hand.toggled'));
            APP.store.dispatch(raiseHand(!raisedHand));
        },
        'toggle-share-audio': () => {
            sendAnalytics(createApiEvent('audio.screen.sharing.toggled'));
            if (isScreenAudioSupported()) {
                APP.store.dispatch(startAudioScreenShareFlow());

                return;
            }

            logger.error('Audio screen sharing is not supported by the current platform!');
        },

        /**
         * Callback to invoke when the "toggle-share-screen" command is received.
         *
         * @param {Object} options - Additional details of how to perform
         * the action. Note this parameter is undocumented and experimental.
         * @param {boolean} options.enable - Whether trying to enable screen
         * sharing or to turn it off.
         * @returns {void}
         */
        'toggle-share-screen': (options = {}) => {
            sendAnalytics(createApiEvent('screen.sharing.toggled'));
            toggleScreenSharing(options.enable);
        },
        'set-noise-suppression-enabled': (options = {}) => {
            APP.store.dispatch(setNoiseSuppressionEnabled(options.enabled));
        },
        'toggle-subtitles': () => {
            APP.store.dispatch(toggleRequestingSubtitles());
        },
        'set-subtitles': (enabled, displaySubtitles, language) => {
            APP.store.dispatch(setRequestingSubtitles(
                enabled, displaySubtitles, language ? `translation-languages:${language}` : null));
        },
        'toggle-tile-view': () => {
            sendAnalytics(createApiEvent('tile-view.toggled'));

            APP.store.dispatch(toggleTileView());
        },
        'set-tile-view': enabled => {
            APP.store.dispatch(setTileView(enabled));
        },
        'video-hangup': (showFeedbackDialog = true) => {
            sendAnalytics(createApiEvent('video.hangup'));
            APP.conference.hangup(showFeedbackDialog);
        },
        'email': email => {
            sendAnalytics(createApiEvent('email.changed'));
            APP.conference.changeLocalEmail(email);
        },
        'avatar-url': avatarUrl => { // @deprecated
            console.warn('Using command avatarUrl is deprecated. Use context.user.avatar in the jwt.');

            sendAnalytics(createApiEvent('avatar.url.changed'));
            APP.conference.changeLocalAvatarUrl(avatarUrl);
        },
        'send-chat-message': (message, to, ignorePrivacy = false) => {
            if (to) {
                const participant = getParticipantById(APP.store.getState(), to);

                if (participant) {
                    APP.store.dispatch(setPrivateMessageRecipient(participant));
                } else {
                    logger.error(`Participant with id ${to} not found!`);

                    return;
                }
            } else {
                APP.store.dispatch(setPrivateMessageRecipient());
            }

            APP.store.dispatch(sendMessage(message, ignorePrivacy));
        },
        'send-endpoint-text-message': (to, text) => {
            try {
                APP.conference.sendEndpointMessage(to, {
                    name: ENDPOINT_TEXT_MESSAGE_NAME,
                    text
                });
            } catch (err) {
                logger.error('Failed sending endpoint text message', err);
            }
        },
        'send-camera-facing-mode-message': (to, facingMode) => {
            if (!to) {
                logger.warn('Participant id not set');

                return;
            }

            APP.conference.sendEndpointMessage(to, {
                name: CAMERA_FACING_MODE_MESSAGE,
                facingMode
            });
        },
        'overwrite-names': participantList => {
            APP.store.dispatch(overwriteParticipantsNames(participantList));
        },
        'toggle-e2ee': enabled => {
            APP.store.dispatch(toggleE2EE(enabled));
        },
        'set-media-encryption-key': keyInfo => {
            APP.store.dispatch(setMediaEncryptionKey(JSON.parse(keyInfo)));
        },
        'set-video-quality': frameHeight => {
            sendAnalytics(createApiEvent('set.video.quality'));
            APP.store.dispatch(setVideoQuality(frameHeight));
        },
        'set-audio-only': enable => {
            sendAnalytics(createApiEvent('set.audio.only'));
            APP.store.dispatch(setAudioOnly(enable));
        },
        'start-share-video': url => {
            sendAnalytics(createApiEvent('share.video.start'));
            const id = extractYoutubeIdOrURL(url);

            if (id) {
                APP.store.dispatch(playSharedVideo(id));
            }
        },
        'stop-share-video': () => {
            sendAnalytics(createApiEvent('share.video.stop'));
            APP.store.dispatch(stopSharedVideo());
        },

        /**
         * Shows a custom in-meeting notification.
         *
         * @param { string } arg.title - Notification title.
         * @param { string } arg.description - Notification description.
         * @param { string } arg.uid - Optional unique identifier for the notification.
         * @param { string } arg.type - Notification type, either `error`, `normal`, `success` or `warning`.
         * Defaults to "normal" if not provided.
         * @param { string } arg.timeout - Timeout type, either `short`, `medium`, `long` or `sticky`.
         * Defaults to "short" if not provided.
         * @param { Array<Object> } arg.customActions - An array of custom actions to be displayed in the notification.
         * Each object should have a `label` and a `uuid` property. It should be used along a listener
         * for the `customNotificationActionTriggered` event to handle the custom action.
         * @returns {void}
         */
        'show-notification': ({
            customActions = [],
            title,
            description,
            uid,
            type = NOTIFICATION_TYPE.NORMAL,
            timeout = NOTIFICATION_TIMEOUT_TYPE.SHORT
        }) => {
            const validTypes = Object.values(NOTIFICATION_TYPE);
            const validTimeouts = Object.values(NOTIFICATION_TIMEOUT_TYPE);

            if (!validTypes.includes(type)) {
                logger.error(`Invalid notification type "${type}". Expecting one of ${validTypes}`);

                return;
            }

            if (!validTimeouts.includes(timeout)) {
                logger.error(`Invalid notification timeout "${timeout}". Expecting one of ${validTimeouts}`);

                return;
            }

            const handlers = customActions.map(({ uuid }) => () => {
                APP.API.notifyCustomNotificationActionTriggered(uuid);
            });

            const keys = customActions.map(({ label }) => label);

            APP.store.dispatch(showNotification({
                customActionHandler: handlers,
                customActionNameKey: keys,
                uid,
                title,
                description,
                appearance: type
            }, timeout));
        },

        /**
         * Removes a notification given a unique identifier.
         *
         * @param { string } uid - Unique identifier for the notification to be removed.
         * @returns {void}
         */
        'hide-notification': uid => {
            APP.store.dispatch(hideNotification(uid));
        },

        /**
         * Starts a file recording or streaming session depending on the passed on params.
         * For RTMP streams, `rtmpStreamKey` must be passed on. `rtmpBroadcastID` is optional.
         * For youtube streams, `youtubeStreamKey` must be passed on. `youtubeBroadcastID` is optional.
         * For dropbox recording, recording `mode` should be `file` and a dropbox oauth2 token must be provided.
         * For file recording, recording `mode` should be `file` and optionally `shouldShare` could be passed on.
         * For local recording, recording `mode` should be `local` and optionally `onlySelf` could be passed on.
         * No other params should be passed.
         *
         * @param { string } arg.mode - Recording mode, either `local`, `file` or `stream`.
         * @param { string } arg.dropboxToken - Dropbox oauth2 token.
         * @param { boolean } arg.onlySelf - Whether to only record the local streams.
         * @param { string } arg.rtmpStreamKey - The RTMP stream key.
         * @param { string } arg.rtmpBroadcastID - The RTMP broadcast ID.
         * @param { boolean } arg.shouldShare - Whether the recording should be shared with the participants or not.
         * Only applies to certain jitsi meet deploys.
         * @param { string } arg.youtubeStreamKey - The youtube stream key.
         * @param { string } arg.youtubeBroadcastID - The youtube broadcast ID.
         * @param { Object } arg.extraMetadata - Any extra metadata params for file recording.
         * @param { boolean } arg.transcription - Whether a transcription should be started or not.
         * @returns {void}
         */
        'start-recording': ({
            mode,
            dropboxToken,
            onlySelf,
            shouldShare,
            rtmpStreamKey,
            rtmpBroadcastID,
            youtubeStreamKey,
            youtubeBroadcastID,
            extraMetadata = {},
            transcription
        }) => {
            const state = APP.store.getState();
            const conference = getCurrentConference(state);

            if (!conference) {
                logger.error('Conference is not defined');

                return;
            }

            if (dropboxToken && !isDropboxEnabled(state)) {
                logger.error('Failed starting recording: dropbox is not enabled on this deployment');

                return;
            }

            if (mode === JitsiRecordingConstants.mode.STREAM && !(youtubeStreamKey || rtmpStreamKey)) {
                logger.error('Failed starting recording: missing youtube or RTMP stream key');

                return;
            }

            if (mode === 'local') {
                const { localRecording } = state['features/base/config'];

                if (!localRecording?.disable && supportsLocalRecording()) {
                    APP.store.dispatch(startLocalVideoRecording(onlySelf));
                } else {
                    logger.error('Failed starting recording: local recording is either disabled or not supported');
                }

                return;
            }

            let recordingConfig;

            if (mode === JitsiRecordingConstants.mode.FILE) {
                const { recordingService } = state['features/base/config'];

                if (!recordingService.enabled && !dropboxToken) {
                    logger.error('Failed starting recording: the recording service is not enabled');

                    return;
                }
                if (dropboxToken) {
                    recordingConfig = {
                        mode: JitsiRecordingConstants.mode.FILE,
                        appData: JSON.stringify({
                            'file_recording_metadata': {
                                ...extraMetadata,
                                'upload_credentials': {
                                    'service_name': RECORDING_TYPES.DROPBOX,
                                    'token': dropboxToken
                                }
                            }
                        })
                    };
                } else {
                    recordingConfig = {
                        mode: JitsiRecordingConstants.mode.FILE,
                        appData: JSON.stringify({
                            'file_recording_metadata': {
                                ...extraMetadata,
                                'share': shouldShare
                            }
                        })
                    };
                }
            } else if (mode === JitsiRecordingConstants.mode.STREAM) {
                recordingConfig = {
                    broadcastId: youtubeBroadcastID || rtmpBroadcastID,
                    mode: JitsiRecordingConstants.mode.STREAM,
                    streamId: youtubeStreamKey || rtmpStreamKey
                };
            }

            if (isScreenshotCaptureEnabled(state, true, false)) {
                APP.store.dispatch(toggleScreenshotCaptureSummary(true));
            }

            // Start audio / video recording, if requested.
            if (typeof recordingConfig !== 'undefined') {
                conference.startRecording(recordingConfig);
            }

            if (transcription) {
                APP.store.dispatch(setRequestingSubtitles(true, false, null));
                conference.getMetadataHandler().setMetadata(RECORDING_METADATA_ID, {
                    isTranscribingEnabled: true
                });
            }
        },

        /**
         * Stops a recording or streaming in progress.
         *
         * @param {string} mode - `local`, `file` or `stream`.
         * @param {boolean} transcription - Whether the transcription needs to be stopped.
         * @returns {void}
         */
        'stop-recording': (mode, transcription) => {
            const state = APP.store.getState();
            const conference = getCurrentConference(state);

            if (!conference) {
                logger.error('Conference is not defined');

                return;
            }

            if (transcription) {
                APP.store.dispatch(setRequestingSubtitles(false, false, null));
                conference.getMetadataHandler().setMetadata(RECORDING_METADATA_ID, {
                    isTranscribingEnabled: false
                });
            }

            if (mode === 'local') {
                APP.store.dispatch(stopLocalVideoRecording());

                return;
            }

            if (![ JitsiRecordingConstants.mode.FILE, JitsiRecordingConstants.mode.STREAM ].includes(mode)) {
                logger.error('Invalid recording mode provided!');

                return;
            }

            const activeSession = getActiveSession(state, mode);

            if (activeSession && activeSession.id) {
                APP.store.dispatch(toggleScreenshotCaptureSummary(false));
                conference.stopRecording(activeSession.id);
            } else {
                logger.error('No recording or streaming session found');
            }
        },
        'initiate-private-chat': participantId => {
            const state = APP.store.getState();
            const participant = getParticipantById(state, participantId);

            if (participant) {
                const { isOpen: isChatOpen } = state['features/chat'];

                if (!isChatOpen) {
                    APP.store.dispatch(toggleChat());
                }
                APP.store.dispatch(openChat(participant));
            } else {
                logger.error('No participant found for the given participantId');
            }
        },
        'cancel-private-chat': () => {
            APP.store.dispatch(setPrivateMessageRecipient());
        },
        'close-breakout-room': roomId => {
            if (!isLocalParticipantModerator(APP.store.getState())) {
                logger.error('Missing moderator rights to close breakout rooms');

                return;
            }
            APP.store.dispatch(closeBreakoutRoom(roomId));
        },
        'join-breakout-room': roomId => {
            APP.store.dispatch(moveToRoom(roomId));
        },
        'send-participant-to-room': (participantId, roomId) => {
            if (!isLocalParticipantModerator(APP.store.getState())) {
                logger.error('Missing moderator rights to send participants to rooms');

                return;
            }

            APP.store.dispatch(sendParticipantToRoom(participantId, roomId));
        },
        'kick-participant': participantId => {
            APP.store.dispatch(kickParticipant(participantId));
        },
        'overwrite-config': config => {
            const whitelistedConfig = getWhitelistedJSON('config', config);

            logger.info(`Overwriting config with: ${JSON.stringify(whitelistedConfig)}`);

            APP.store.dispatch(overwriteConfig(whitelistedConfig));
        },
        'toggle-virtual-background': () => {
            APP.store.dispatch(toggleDialog(SettingsDialog, {
                defaultTab: SETTINGS_TABS.VIRTUAL_BACKGROUND }));
        },
        'end-conference': () => {
            APP.store.dispatch(endConference());
            const state = APP.store.getState();
            const conference = getCurrentConference(state);

            if (!conference) {
                logger.error('Conference not yet available');
            } else if (conference.isEndConferenceSupported()) {
                APP.store.dispatch(endConference());
            } else {
                logger.error(' End Conference not supported');
            }
        },
        'toggle-whiteboard': () => {
            APP.store.dispatch(toggleWhiteboard());
        },
        'set-virtual-background': (enabled, backgroundImage) => {
            const tracks = APP.store.getState()['features/base/tracks'];
            const jitsiTrack = getLocalVideoTrack(tracks)?.jitsiTrack;

            APP.store.dispatch(toggleBackgroundEffect({
                backgroundEffectEnabled: enabled,
                backgroundType: VIRTUAL_BACKGROUND_TYPE.IMAGE,
                virtualSource: backgroundImage
            }, jitsiTrack));
        }
    };
    transport.on('event', ({ data, name }) => {
        if (name && commands[name]) {
            logger.info(`API command received: ${name}`);
            commands[name](...data);

            return true;
        }

        return false;
    });
    transport.on('request', (request, callback) => {
        const { dispatch, getState } = APP.store;

        if (processExternalDeviceRequest(dispatch, getState, request, callback)) {
            return true;
        }

        const { name } = request;

        switch (name) {
        case 'capture-largevideo-screenshot' :
            APP.store.dispatch(captureLargeVideoScreenshot())
                .then(dataURL => {
                    let error;

                    if (!dataURL) {
                        error = new Error('No large video found!');
                    }

                    callback({
                        error,
                        dataURL
                    });
                });
            break;
        case 'deployment-info':
            callback(APP.store.getState()['features/base/config'].deploymentInfo);
            break;
        case 'invite': {
            const { invitees } = request;

            if (!Array.isArray(invitees) || invitees.length === 0) {
                callback({
                    error: new Error('Unexpected format of invitees')
                });

                break;
            }

            // The store should be already available because API.init is called
            // on appWillMount action.
            APP.store.dispatch(
                invite(invitees, true))
                .then(failedInvitees => {
                    let error;
                    let result;

                    if (failedInvitees.length) {
                        error = new Error('One or more invites failed!');
                    } else {
                        result = true;
                    }

                    callback({
                        error,
                        result
                    });
                });
            break;
        }
        case 'is-audio-muted':
            callback(APP.conference.isLocalAudioMuted());
            break;
        case 'is-audio-disabled':
            callback(isAudioMuteButtonDisabled(APP.store.getState()));
            break;
        case 'is-moderation-on': {
            const { mediaType } = request;
            const type = mediaType || MEDIA_TYPE.AUDIO;

            callback(isEnabledFromState(type, APP.store.getState()));
            break;
        }
        case 'is-participant-force-muted': {
            const state = APP.store.getState();
            const { participantId, mediaType } = request;
            const type = mediaType || MEDIA_TYPE.AUDIO;
            const participant = getParticipantById(state, participantId);

            callback(isForceMuted(participant, type, state));
            break;
        }
        case 'is-participants-pane-open': {
            callback(getParticipantsPaneOpen(APP.store.getState()));
            break;
        }
        case 'is-video-muted':
            callback(APP.conference.isLocalVideoMuted());
            break;
        case 'is-audio-available':
            callback(audioAvailable);
            break;
        case 'is-video-available':
            callback(videoAvailable);
            break;
        case 'is-sharing-screen':
            callback(Boolean(APP.conference.isSharingScreen));
            break;
        case 'is-start-silent':
            callback(Boolean(APP.store.getState()['features/base/config'].startSilent));
            break;
        case 'get-content-sharing-participants': {
            const sharingParticipantIds = getScreenshareParticipantIds(APP.store.getState());

            callback({
                sharingParticipantIds
            });
            break;
        }
        case 'get-livestream-url': {
            const state = APP.store.getState();
            const conference = getCurrentConference(state);
            let livestreamUrl;

            if (conference) {
                const activeSession = getActiveSession(state, JitsiRecordingConstants.mode.STREAM);

                livestreamUrl = activeSession?.liveStreamViewURL;
            } else {
                logger.error('Conference is not defined');
            }
            callback({
                livestreamUrl
            });
            break;
        }
        case 'get-custom-avatar-backgrounds' : {
            callback({
                avatarBackgrounds: APP.store.getState()['features/dynamic-branding'].avatarBackgrounds
            });
            break;
        }
        case 'list-breakout-rooms': {
            callback(getBreakoutRooms(APP.store.getState()));
            break;
        }
        case 'rooms-info': {
            callback(getRoomsInfo(APP.store.getState()));
            break;
        }
        case 'get-shared-document-url': {
            const { etherpad } = APP.store.getState()['features/etherpad'];

            callback(etherpad?.documentUrl || '');
            break;
        }
        case 'get-p2p-status': {
            callback(isP2pActive(APP.store.getState()));
            break;
        }
        case 'session-id': {
            const { conference } = APP.store.getState()['features/base/conference'];

            callback(conference?.getMeetingUniqueId() || '');
            break;
        }
        case '_new_electron_screensharing_supported': {
            callback(true);

            break;
        }
        case 'open-desktop-picker': {
            const { desktopSharingSources } = APP.store.getState()['features/base/config'];
            const options = {
                desktopSharingSources: desktopSharingSources ?? [ 'screen', 'window' ]
            };
            const onSourceChoose = (_streamId, _type, screenShareAudio, source) => {
                callback({
                    screenShareAudio,
                    source
                });
            };

            dispatch(showDesktopPicker(options, onSourceChoose));

            break;
        }
        default:
            callback({ error: new Error('UnknownRequestError') });

            return false;
        }

        return true;
    });
}

/**
 * Check whether the API should be enabled or not.
 *
 * @returns {boolean}
 */
function shouldBeEnabled() {
    return (
        typeof API_ID === 'number'

            // XXX Enable the API when a JSON Web Token (JWT) is specified in
            // the location/URL because then it is very likely that the Jitsi
            // Meet (Web) app is being used by an external/wrapping (Web) app
            // and, consequently, the latter will need to communicate with the
            // former. (The described logic is merely a heuristic though.)
            || parseJWTFromURLParams());
}

/**
 * Executes on toggle-share-screen command.
 *
 * @param {boolean} [enable] - Whether this toggle is to explicitly enable or
 * disable screensharing. If not defined, the application will automatically
 * attempt to toggle between enabled and disabled. This boolean is useful for
 * explicitly setting desired screensharing state.
 * @returns {void}
 */
function toggleScreenSharing(enable) {
    if (JitsiMeetJS.isDesktopSharingEnabled()) {
        APP.store.dispatch(startScreenShareFlow(enable));
    }
}

/**
 * Removes sensitive data from a mouse event.
 *
 * @param {MouseEvent} event - The mouse event to sanitize.
 * @returns {Object}
 */
function sanitizeMouseEvent(event) {
    const {
        clientX,
        clientY,
        movementX,
        movementY,
        offsetX,
        offsetY,
        pageX,
        pageY,
        x,
        y,
        screenX,
        screenY
    } = event;

    return {
        clientX,
        clientY,
        movementX,
        movementY,
        offsetX,
        offsetY,
        pageX,
        pageY,
        x,
        y,
        screenX,
        screenY
    };
}

/**
 * Implements API class that communicates with external API class and provides
 * interface to access Jitsi Meet features by external applications that embed
 * Jitsi Meet.
 */
class API {
    _enabled;

    /**
     * Initializes the API. Setups message event listeners that will receive
     * information from external applications that embed Jitsi Meet. It also
     * sends a message to the external application that API is initialized.
     *
     * @param {Object} options - Optional parameters.
     * @returns {void}
     */
    init() {
        if (!shouldBeEnabled()) {
            return;
        }

        /**
         * Current status (enabled/disabled) of API.
         *
         * @private
         * @type {boolean}
         */
        this._enabled = true;

        initCommands();

        this.notifyBrowserSupport(isSupportedBrowser());

        // Let the embedder know we are ready.
        this._sendEvent({ name: 'ready' });
    }

    /**
     * Notify external application (if API is enabled) that the large video
     * visibility changed.
     *
     * @param {boolean} isHidden - True if the large video is hidden and false
     * otherwise.
     * @returns {void}
     */
    notifyLargeVideoVisibilityChanged(isHidden) {
        this._sendEvent({
            name: 'large-video-visibility-changed',
            isVisible: !isHidden
        });
    }

    /**
     * Notifies the external application (spot) that the local jitsi-participant
     * has a status update.
     *
     * @param {Object} event - The message to pass onto spot.
     * @returns {void}
     */
    sendProxyConnectionEvent(event) {
        this._sendEvent({
            name: 'proxy-connection-event',
            ...event
        });
    }

    /**
     * Sends event to the external application.
     *
     * @param {Object} event - The event to be sent.
     * @returns {void}
     */
    _sendEvent(event = {}) {
        if (this._enabled) {
            try {
                transport.sendEvent(event);
            } catch (error) {
                logger.error('Failed to send and IFrame API event', error);
            }
        }
    }

    /**
     * Notify external application (if API is enabled) that the chat state has been updated.
     *
     * @param {number} unreadCount - The unread messages counter.
     * @param {boolean} isOpen - True if the chat panel is open.
     * @returns {void}
     */
    notifyChatUpdated(unreadCount, isOpen) {
        this._sendEvent({
            name: 'chat-updated',
            unreadCount,
            isOpen
        });
    }

    /**
     * Notify external application (if API is enabled) that message was sent.
     *
     * @param {string} message - Message body.
     * @param {boolean} privateMessage - True if the message was a private message.
     * @returns {void}
     */
    notifySendingChatMessage(message, privateMessage) {
        this._sendEvent({
            name: 'outgoing-message',
            message,
            privateMessage
        });
    }

    /**
     * Notify external application (if API is enabled) that the mouse has entered inside the iframe.
     *
     * @param {MouseEvent} event - The mousemove event.
     * @returns {void}
     */
    notifyMouseEnter(event) {
        this._sendEvent({
            name: 'mouse-enter',
            event: sanitizeMouseEvent(event)
        });
    }

    /**
     * Notify external application (if API is enabled) that the mouse has entered inside the iframe.
     *
     * @param {MouseEvent} event - The mousemove event.
     * @returns {void}
     */
    notifyMouseLeave(event) {
        this._sendEvent({
            name: 'mouse-leave',
            event: sanitizeMouseEvent(event)
        });
    }

    /**
     * Notify external application (if API is enabled) that the mouse has moved inside the iframe.
     *
     * @param {MouseEvent} event - The mousemove event.
     * @returns {void}
     */
    notifyMouseMove(event) {
        this._sendEvent({
            name: 'mouse-move',
            event: sanitizeMouseEvent(event)
        });
    }

    /**
     * Notify the external application that the moderation status has changed.
     *
     * @param {string} mediaType - Media type for which the moderation changed.
     * @param {boolean} enabled - Whether or not the new moderation status is enabled.
     * @returns {void}
     */
    notifyModerationChanged(mediaType, enabled) {
        this._sendEvent({
            name: 'moderation-status-changed',
            mediaType,
            enabled
        });
    }

    /**
     * Notify the external application that a participant was approved on moderation.
     *
     * @param {string} participantId - The ID of the participant that got approved.
     * @param {string} mediaType - Media type for which the participant was approved.
     * @returns {void}
     */
    notifyParticipantApproved(participantId, mediaType) {
        this._sendEvent({
            name: 'moderation-participant-approved',
            id: participantId,
            mediaType
        });
    }

    /**
     * Notify the external application that a participant was rejected on moderation.
     *
     * @param {string} participantId - The ID of the participant that got rejected.
     * @param {string} mediaType - Media type for which the participant was rejected.
     * @returns {void}
     */
    notifyParticipantRejected(participantId, mediaType) {
        this._sendEvent({
            name: 'moderation-participant-rejected',
            id: participantId,
            mediaType
        });
    }

    /**
     * Notify the external app that a notification has been triggered.
     *
     * @param {string} title - The notification title.
     * @param {string} description - The notification description.
     *
     * @returns {void}
     */
    notifyNotificationTriggered(title, description) {
        this._sendEvent({
            description,
            name: 'notification-triggered',
            title
        });
    }

    /**
     * Notify request desktop sources.
     *
     * @param {Object} options - Object with the options for desktop sources.
     * @returns {void}
     */
    requestDesktopSources(options) {
        return transport.sendRequest({
            name: '_request-desktop-sources',
            options
        });
    }

    /**
     * Notify external application that the video quality setting has changed.
     *
     * @param {number} videoQuality - The video quality. The number represents the maximum height of the video streams.
     * @returns {void}
     */
    notifyVideoQualityChanged(videoQuality) {
        this._sendEvent({
            name: 'video-quality-changed',
            videoQuality
        });
    }

    /**
     * Notify external application (if API is enabled) that message was
     * received.
     *
     * @param {Object} options - Object with the message properties.
     * @returns {void}
     */
    notifyReceivedChatMessage(
            { body, from, nick, privateMessage, ts } = {}) {
        if (APP.conference.isLocalId(from)) {
            return;
        }

        this._sendEvent({
            name: 'incoming-message',
            from,
            message: body,
            nick,
            privateMessage,
            stamp: ts
        });
    }

    /**
     * Notify external application (if API is enabled) that user joined the
     * conference.
     *
     * @param {string} id - User id.
     * @param {Object} props - The display name of the user.
     * @returns {void}
     */
    notifyUserJoined(id, props) {
        this._sendEvent({
            name: 'participant-joined',
            id,
            ...props
        });
    }

    /**
     * Notify external application (if API is enabled) that user left the
     * conference.
     *
     * @param {string} id - User id.
     * @returns {void}
     */
    notifyUserLeft(id) {
        this._sendEvent({
            name: 'participant-left',
            id
        });
    }

    /**
     * Notify external application (if API is enabled) that the user role
     * has changed.
     *
     * @param {string} id - User id.
     * @param {string} role - The new user role.
     * @returns {void}
     */
    notifyUserRoleChanged(id, role) {
        this._sendEvent({
            name: 'participant-role-changed',
            id,
            role
        });
    }

    /**
     * Notify external application (if API is enabled) that user changed their
     * avatar.
     *
     * @param {string} id - User id.
     * @param {string} avatarURL - The new avatar URL of the participant.
     * @returns {void}
     */
    notifyAvatarChanged(id, avatarURL) {
        this._sendEvent({
            name: 'avatar-changed',
            avatarURL,
            id
        });
    }

    /**
     * Notify external application (if API is enabled) that user received
     * a text message through datachannels.
     *
     * @param {Object} data - The event data.
     * @returns {void}
     */
    notifyEndpointTextMessageReceived(data) {
        this._sendEvent({
            name: 'endpoint-text-message-received',
            data
        });
    }

    /**
     * Notify external application (if API is enabled) that some face landmark data is available.
     *
     * @param {Object | undefined} faceBox - Detected face(s) bounding box (left, right, width).
     * @param {string} faceExpression - Detected face expression.
     * @returns {void}
     */
    notifyFaceLandmarkDetected(faceBox, faceExpression) {
        this._sendEvent({
            name: 'face-landmark-detected',
            faceBox,
            faceExpression
        });
    }

    /**
     * Notify external application (if API is enabled) that a custom notification action has been triggered.
     *
     * @param {string} actionUuid - The UUID of the action that has been triggered.
     * @returns {void}
    */
    notifyCustomNotificationActionTriggered(actionUuid) {
        this._sendEvent({
            name: 'custom-notification-action-triggered',
            data: {
                id: actionUuid
            }
        });
    }

    /**
     * Notify external application (if API is enabled) that the list of sharing participants changed.
     *
     * @param {Object} data - The event data.
     * @returns {void}
     */
    notifySharingParticipantsChanged(data) {
        this._sendEvent({
            name: 'content-sharing-participants-changed',
            data
        });
    }

    /**
     * Notify external application (if API is enabled) that the device list has
     * changed.
     *
     * @param {Object} devices - The new device list.
     * @returns {void}
     */
    notifyDeviceListChanged(devices) {
        this._sendEvent({
            name: 'device-list-changed',
            devices
        });
    }

    /**
     * Notify external application (if API is enabled) that user changed their
     * nickname.
     *
     * @param {string} id - User id.
     * @param {string} displayname - User nickname.
     * @param {string} formattedDisplayName - The display name shown in Jitsi
     * meet's UI for the user.
     * @returns {void}
     */
    notifyDisplayNameChanged(
            id,
            { displayName, formattedDisplayName }) {
        this._sendEvent({
            name: 'display-name-change',
            displayname: displayName,
            formattedDisplayName,
            id
        });
    }

    /**
     * Notify external application (if API is enabled) that user changed their
     * email.
     *
     * @param {string} id - User id.
     * @param {string} email - The new email of the participant.
     * @returns {void}
     */
    notifyEmailChanged(
            id,
            { email }) {
        this._sendEvent({
            name: 'email-change',
            email,
            id
        });
    }

    /**
     * Notify external application (if API is enabled) that the an error has been logged.
     *
     * @param {string} logLevel - The message log level.
     * @param {Array<string>} args - Array of strings composing the log message.
     * @returns {void}
     */
    notifyLog(logLevel, args = []) {
        if (!Array.isArray(args)) {
            logger.error('notifyLog received wrong argument types!');

            return;
        }

        // Trying to convert arguments to strings. Otherwise in order to send the event the arguments will be formatted
        // with JSON.stringify which can throw an error because of circular objects and we will lose the whole log.
        const formattedArguments = [];

        args.forEach(arg => {
            let formattedArgument = '';

            if (arg instanceof Error) {
                formattedArgument += `${arg.toString()}: ${arg.stack}`;
            } else if (typeof arg === 'object') {
                // NOTE: The non-enumerable properties of the objects wouldn't be included in the string after
                // JSON.stringify. For example Map instance will be translated to '{}'. So I think we have to eventually
                // do something better for parsing the arguments. But since this option for stringify is part of the
                // public interface and I think it could be useful in some cases I will it for now.
                try {
                    formattedArgument += JSON.stringify(arg);
                } catch (error) {
                    formattedArgument += arg;
                }
            } else {
                formattedArgument += arg;
            }

            formattedArguments.push(formattedArgument);
        });

        this._sendEvent({
            name: 'log',
            logLevel,
            args: formattedArguments
        });
    }

    /**
     * Notify external application (if API is enabled) that the conference has
     * been joined.
     *
     * @param {string} roomName - The room name.
     * @param {string} id - The id of the local user.
     * @param {Object} props - The display name, the avatar URL of the local
     * user and the type of the room.
     * @returns {void}
     */
    notifyConferenceJoined(roomName, id, props) {
        this._sendEvent({
            name: 'video-conference-joined',
            roomName,
            id,
            ...props
        });
    }

    /**
     * Notify external application (if API is enabled) that local user has left the conference.
     *
     * @param {string} roomName - User id.
     * @returns {void}
     */
    notifyConferenceLeft(roomName) {
        this._sendEvent({
            name: 'video-conference-left',
            roomName
        });
    }

    /**
     * Notify external application that the data channel has been closed.
     *
     * @param {number} code - The close code.
     * @param {string} reason - The close reason.
     *
     * @returns {void}
     */
    notifyDataChannelClosed(code, reason) {
        this._sendEvent({
            name: 'data-channel-closed',
            code,
            reason
        });
    }

    /**
     * Notify external application that the data channel has been opened.
     *
     * @returns {void}
     */
    notifyDataChannelOpened() {
        this._sendEvent({ name: 'data-channel-opened' });
    }

    /**
     * Notify external application (if API is enabled) that we are ready to be
     * closed.
     *
     * @returns {void}
     */
    notifyReadyToClose() {
        this._sendEvent({ name: 'video-ready-to-close' });
    }

    /**
     * Notify external application (if API is enabled) that a suspend event in host computer.
     *
     * @returns {void}
     */
    notifySuspendDetected() {
        this._sendEvent({ name: 'suspend-detected' });
    }

    /**
     * Notify external application (if API is enabled) for audio muted status
     * changed.
     *
     * @param {boolean} muted - The new muted status.
     * @returns {void}
     */
    notifyAudioMutedStatusChanged(muted) {
        this._sendEvent({
            name: 'audio-mute-status-changed',
            muted
        });
    }

    /**
     * Notify external application (if API is enabled) for video muted status
     * changed.
     *
     * @param {boolean} muted - The new muted status.
     * @returns {void}
     */
    notifyVideoMutedStatusChanged(muted) {
        this._sendEvent({
            name: 'video-mute-status-changed',
            muted
        });
    }

    /**
     * Notify external application (if API is enabled) for audio availability
     * changed.
     *
     * @param {boolean} available - True if available and false otherwise.
     * @returns {void}
     */
    notifyAudioAvailabilityChanged(available) {
        audioAvailable = available;
        this._sendEvent({
            name: 'audio-availability-changed',
            available
        });
    }

    /**
     * Notify external application (if API is enabled) for video available
     * status changed.
     *
     * @param {boolean} available - True if available and false otherwise.
     * @returns {void}
     */
    notifyVideoAvailabilityChanged(available) {
        videoAvailable = available;
        this._sendEvent({
            name: 'video-availability-changed',
            available
        });
    }

    /**
     * Notify external application (if API is enabled) that the on stage
     * participant has changed.
     *
     * @param {string} id - User id of the new on stage participant.
     * @returns {void}
     */
    notifyOnStageParticipantChanged(id) {
        this._sendEvent({
            name: 'on-stage-participant-changed',
            id
        });
    }

    /**
     * Notify external application (if API is enabled) that the prejoin video
     * visibility had changed.
     *
     * @param {boolean} isVisible - Whether the prejoin video is visible.
     * @returns {void}
     */
    notifyPrejoinVideoVisibilityChanged(isVisible) {
        this._sendEvent({
            name: 'on-prejoin-video-changed',
            isVisible
        });
    }

    /**
     * Notify external application (if API is enabled) that the prejoin
     * screen was loaded.
     *
     * @returns {void}
     */
    notifyPrejoinLoaded() {
        const state = APP.store.getState();
        const { defaultLocalDisplayName } = state['features/base/config'];
        const displayName = getDisplayName(state);

        this._sendEvent({
            name: 'prejoin-screen-loaded',
            id: LOCAL_PARTICIPANT_DEFAULT_ID,
            displayName,
            formattedDisplayName: appendSuffix(displayName, defaultLocalDisplayName)
        });
    }

    /**
     * Notify external application of an unexpected camera-related error having
     * occurred.
     *
     * @param {string} type - The type of the camera error.
     * @param {string} message - Additional information about the error.
     * @returns {void}
     */
    notifyOnCameraError(type, message) {
        this._sendEvent({
            name: 'camera-error',
            type,
            message
        });
    }

    /**
     * Notify external application of an unexpected mic-related error having
     * occurred.
     *
     * @param {string} type - The type of the mic error.
     * @param {string} message - Additional information about the error.
     * @returns {void}
     */
    notifyOnMicError(type, message) {
        this._sendEvent({
            name: 'mic-error',
            type,
            message
        });
    }

    /**
     * Notify external application (if API is enabled) that conference feedback
     * has been submitted. Intended to be used in conjunction with the
     * submit-feedback command to get notified if feedback was submitted.
     *
     * @param {string} error - A failure message, if any.
     * @returns {void}
     */
    notifyFeedbackSubmitted(error) {
        this._sendEvent({
            name: 'feedback-submitted',
            error
        });
    }

    /**
     * Notify external application (if API is enabled) that the feedback prompt
     * has been displayed.
     *
     * @returns {void}
     */
    notifyFeedbackPromptDisplayed() {
        this._sendEvent({ name: 'feedback-prompt-displayed' });
    }

    /**
     * Notify external application (if API is enabled) that the display
     * configuration of the filmstrip has been changed.
     *
     * @param {boolean} visible - Whether or not the filmstrip has been set to
     * be displayed or hidden.
     * @returns {void}
     */
    notifyFilmstripDisplayChanged(visible) {
        this._sendEvent({
            name: 'filmstrip-display-changed',
            visible
        });
    }

    /**
     * Notify external application of a participant, remote or local, being
     * removed from the conference by another participant.
     *
     * @param {Object} kicked - The participant removed from the
     * conference.
     * @param {Object} kicker - The participant that removed the
     * other participant.
     * @returns {void}
     */
    notifyKickedOut(kicked, kicker) {
        this._sendEvent({
            name: 'participant-kicked-out',
            kicked,
            kicker
        });
    }

    /**
     * Notify external application of the current meeting requiring a password
     * to join.
     *
     * @returns {void}
     */
    notifyOnPasswordRequired() {
        this._sendEvent({ name: 'password-required' });
    }

    /**
     * Notify external application (if API is enabled) that the screen sharing
     * has been turned on/off.
     *
     * @param {boolean} on - True if screen sharing is enabled.
     * @param {Object} details - Additional information about the screen
     * sharing.
     * @param {string} details.sourceType - Type of device or window the screen
     * share is capturing.
     * @returns {void}
     */
    notifyScreenSharingStatusChanged(on, details) {
        this._sendEvent({
            name: 'screen-sharing-status-changed',
            on,
            details
        });
    }

    /**
     * Notify external application (if API is enabled) that the dominant speaker
     * has been turned on/off.
     *
     * @param {string} id - Id of the dominant participant.
     * @returns {void}
     */
    notifyDominantSpeakerChanged(id) {
        this._sendEvent({
            name: 'dominant-speaker-changed',
            id
        });
    }

    /**
     * Notify external application (if API is enabled) that the conference
     * changed their subject.
     *
     * @param {string} subject - Conference subject.
     * @returns {void}
     */
    notifySubjectChanged(subject) {
        this._sendEvent({
            name: 'subject-change',
            subject
        });
    }

    /**
     * Notify external application (if API is enabled) that tile view has been
     * entered or exited.
     *
     * @param {string} enabled - True if tile view is currently displayed, false
     * otherwise.
     * @returns {void}
     */
    notifyTileViewChanged(enabled) {
        this._sendEvent({
            name: 'tile-view-changed',
            enabled
        });
    }

    /**
     * Notify external application (if API is enabled) that the localStorage has changed.
     *
     * @param {string} localStorageContent - The new localStorageContent.
     * @returns {void}
     */
    notifyLocalStorageChanged(localStorageContent) {
        this._sendEvent({
            name: 'local-storage-changed',
            localStorageContent
        });
    }

    /**
     * Notify external application (if API is enabled) that user updated their hand raised.
     *
     * @param {string} id - User id.
     * @param {boolean} handRaised - Whether user has raised hand.
     * @returns {void}
     */
    notifyRaiseHandUpdated(id, handRaised) {
        this._sendEvent({
            name: 'raise-hand-updated',
            handRaised,
            id
        });
    }

    /**
     * Notify external application (if API is enabled) that recording has started or stopped.
     *
     * @param {boolean} on - True if recording is on, false otherwise.
     * @param {string} mode - Stream or file or local.
     * @param {string} error - Error type or null if success.
     * @param {boolean} transcription - True if a transcription is being recorded, false otherwise.
     * @returns {void}
     */
    notifyRecordingStatusChanged(on, mode, error, transcription) {
        this._sendEvent({
            name: 'recording-status-changed',
            on,
            mode,
            error,
            transcription
        });
    }

    /**
     * Notify external application (if API is enabled) that the current recording link is
     * available.
     *
     * @param {string} link - The recording download link.
     * @param {number} ttl - The recording download link time to live.
     * @returns {void}
     */
    notifyRecordingLinkAvailable(link, ttl) {
        this._sendEvent({
            name: 'recording-link-available',
            link,
            ttl
        });
    }

    /**
     * Notify external application (if API is enabled) that a participant is knocking in the lobby.
     *
     * @param {Object} participant - Participant data such as id and name.
     * @returns {void}
     */
    notifyKnockingParticipant(participant) {
        this._sendEvent({
            name: 'knocking-participant',
            participant
        });
    }

    /**
     * Notify external application (if API is enabled) that an error occurred.
     *
     * @param {Object} error - The error.
     * @returns {void}
     */
    notifyError(error) {
        this._sendEvent({
            name: 'error-occurred',
            error
        });
    }

    /**
     * Notify external application ( if API is enabled) that a toolbar button was clicked.
     *
     * @param {string} key - The key of the toolbar button.
     * @param {boolean} preventExecution - Whether execution of the button click was prevented or not.
     * @returns {void}
     */
    notifyToolbarButtonClicked(key, preventExecution) {
        this._sendEvent({
            name: 'toolbar-button-clicked',
            key,
            preventExecution
        });
    }

    /**
     * Notify external application (if API is enabled) that transcribing has started or stopped.
     *
     * @param {boolean} on - True if transcribing is on, false otherwise.
     * @returns {void}
     */
    notifyTranscribingStatusChanged(on) {
        this._sendEvent({
            name: 'transcribing-status-changed',
            on
        });
    }

    /**
     * Notify external application (if API is enabled) that the user received
     * a transcription chunk.
     *
     * @param {Object} data - The event data.
     * @returns {void}
     */
    notifyTranscriptionChunkReceived(data) {
        this._sendEvent({
            name: 'transcription-chunk-received',
            data
        });
    }

    /**
     * Notify external application (if API is enabled) whether the used browser is supported or not.
     *
     * @param {boolean} supported - If browser is supported or not.
     * @returns {void}
     */
    notifyBrowserSupport(supported) {
        this._sendEvent({
            name: 'browser-support',
            supported
        });
    }

    /**
     * Notify external application that the breakout rooms changed.
     *
     * @param {Array} rooms - Array containing the breakout rooms and main room.
     * @returns {void}
     */
    notifyBreakoutRoomsUpdated(rooms) {
        this._sendEvent({
            name: 'breakout-rooms-updated',
            rooms
        });
    }

    /**
     * Notify the external application that the state of the participants pane changed.
     *
     * @param {boolean} open - Whether the panel is open or not.
     * @returns {void}
     */
    notifyParticipantsPaneToggled(open) {
        this._sendEvent({
            name: 'participants-pane-toggled',
            open
        });
    }

    /**
     * Notify the external application that the audio or video is being shared by a participant.
     *
     * @param {string} mediaType - Whether the content which is being shared is audio or video.
     * @param {string} value - Whether the sharing is playing, pause or stop (on audio there is only playing and stop).
     * @param {string} participantId - Participant id of the participant which started or ended
     *  the video or audio sharing.
     * @returns {void}
     */
    notifyAudioOrVideoSharingToggled(mediaType, value, participantId) {
        this._sendEvent({
            name: 'audio-or-video-sharing-toggled',
            mediaType,
            value,
            participantId
        });
    }

    /**
     * Notify the external application that a PeerConnection lost connectivity. This event is fired only if
     * a PC `failed` but connectivity to the rtcstats server is still maintained signaling that there is a
     * problem establishing a link between the app and the JVB server or the remote peer in case of P2P.
     * Will only fire if rtcstats is enabled.
     *
     * @param {boolean} isP2P - Type of PC.
     * @param {boolean} wasConnected - Was this connection previously connected. If it was it could mean
     * that connectivity was disrupted, if not it most likely means that the app could not reach
     * the JVB server, or the other peer in case of P2P.
     *
     * @returns {void}
     */
    notifyPeerConnectionFailure(isP2P, wasConnected) {
        this._sendEvent({
            name: 'peer-connection-failure',
            isP2P,
            wasConnected
        });
    }

    /**
     * Notify external application ( if API is enabled) that a participant menu button was clicked.
     *
     * @param {string} key - The key of the participant menu button.
     * @param {string} participantId - The ID of the participant for whom the participant menu button was clicked.
     * @param {boolean} preventExecution - Whether execution of the button click was prevented or not.
     * @returns {void}
     */
    notifyParticipantMenuButtonClicked(key, participantId, preventExecution) {
        this._sendEvent({
            name: 'participant-menu-button-clicked',
            key,
            participantId,
            preventExecution
        });
    }

    /**
     * Notify external application (if API is enabled) if whiteboard state is
     * changed.
     *
     * @param {WhiteboardStatus} status - The new whiteboard status.
     * @returns {void}
     */
    notifyWhiteboardStatusChanged(status) {
        this._sendEvent({
            name: 'whiteboard-status-changed',
            status
        });
    }

    /**
     * Notify external application (if API is enabled) if non participant message
     * is received.
     *
     * @param {string} id - The resource id of the sender.
     * @param {Object} json - The json carried by the message.
     * @returns {void}
     */
    notifyNonParticipantMessageReceived(id, json) {
        this._sendEvent({
            name: 'non-participant-message-received',
            id,
            message: json
        });
    }


    /**
     * Notify external application (if API is enabled) the conference
     * start time.
     *
     * @param {number} timestamp - Timestamp conference was created.
     * @returns {void}
     */
    notifyConferenceCreatedTimestamp(timestamp) {
        this._sendEvent({
            name: 'conference-created-timestamp',
            timestamp
        });
    }


    /**
     * Notify the external application (if API is enabled) if the connection type changed.
     *
     * @param {boolean} isP2p - Whether the new connection is P2P.
     * @returns {void}
     */
    notifyP2pStatusChanged(isP2p) {
        this._sendEvent({
            name: 'p2p-status-changed',
            isP2p
        });
    }

    /**
     * Notify the external application (if API is enabled) when the compute pressure changed.
     *
     * @param {Array} records - The new pressure records.
     * @returns {void}
     */
    notifyComputePressureChanged(records) {
        this._sendEvent({
            name: 'compute-pressure-changed',
            records
        });
    }

    /**
     * Notify the external application (if API is enabled) when the audio only enabled status changed.
     *
     * @param {boolean} enabled - Whether the audio only is enabled or not.
     * @returns {void}
     */
    notifyAudioOnlyChanged(enabled) {
        this._sendEvent({
            name: 'audio-only-changed',
            enabled
        });
    }

    /**
     * Disposes the allocated resources.
     *
     * @returns {void}
     */
    dispose() {
        if (this._enabled) {
            this._enabled = false;
        }
    }
}

export default new API();
