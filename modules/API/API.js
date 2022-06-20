// @flow

import { BrowserDetection } from '@jitsi/js-utils';
import Logger from '@jitsi/logger';

import {
    createApiEvent,
    sendAnalytics
} from '../../react/features/analytics';
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
import {
    getCurrentConference,
    sendTones,
    setFollowMe,
    setLocalSubject,
    setPassword,
    setSubject
} from '../../react/features/base/conference';
import { overwriteConfig, getWhitelistedJSON } from '../../react/features/base/config';
import { toggleDialog } from '../../react/features/base/dialog/actions';
import { isSupportedBrowser } from '../../react/features/base/environment';
import { parseJWTFromURLParams } from '../../react/features/base/jwt';
import JitsiMeetJS, { JitsiRecordingConstants } from '../../react/features/base/lib-jitsi-meet';
import { MEDIA_TYPE } from '../../react/features/base/media';
import {
    getLocalParticipant,
    getParticipantById,
    pinParticipant,
    kickParticipant,
    raiseHand,
    isParticipantModerator,
    isLocalParticipantModerator,
    hasRaisedHand,
    grantModerator,
    overwriteParticipantsNames
} from '../../react/features/base/participants';
import { updateSettings } from '../../react/features/base/settings';
import { isToggleCameraEnabled, toggleCamera } from '../../react/features/base/tracks';
import { getLocalJitsiVideoTrack } from '../../react/features/base/tracks/functions';
import { toggleBackgroundEffect } from '../../react/features/virtual-background/actions';
import {
    autoAssignToBreakoutRooms,
    closeBreakoutRoom,
    createBreakoutRoom,
    moveToRoom,
    removeBreakoutRoom,
    sendParticipantToRoom
} from '../../react/features/breakout-rooms/actions';
import { getBreakoutRooms } from '../../react/features/breakout-rooms/functions';
import {
    sendMessage,
    setPrivateMessageRecipient,
    toggleChat
} from '../../react/features/chat/actions';
import { openChat } from '../../react/features/chat/actions.web';
import {
    processExternalDeviceRequest
} from '../../react/features/device-selection/functions';
import { isEnabled as isDropboxEnabled } from '../../react/features/dropbox';
import { mediaPermissionPromptVisibilityChanged } from '../../react/features/overlay/actions';
import { setMediaEncryptionKey, toggleE2EE } from '../../react/features/e2ee/actions';
import { setVolume } from '../../react/features/filmstrip';
import { invite } from '../../react/features/invite';
import {
    selectParticipantInLargeVideo
} from '../../react/features/large-video/actions.any';
import {
    captureLargeVideoScreenshot,
    resizeLargeVideo
} from '../../react/features/large-video/actions.web';
import { toggleLobbyMode, answerKnockingParticipant } from '../../react/features/lobby/actions';
import {
    close as closeParticipantsPane,
    open as openParticipantsPane
} from '../../react/features/participants-pane/actions';
import { getParticipantsPaneOpen, isForceMuted } from '../../react/features/participants-pane/functions';
import { RECORDING_TYPES } from '../../react/features/recording/constants';
import { getActiveSession } from '../../react/features/recording/functions';
import { isScreenAudioSupported } from '../../react/features/screen-share';
import { startScreenShareFlow, startAudioScreenShareFlow } from '../../react/features/screen-share/actions';
import { toggleScreenshotCaptureSummary } from '../../react/features/screenshot-capture';
import { isScreenshotCaptureEnabled } from '../../react/features/screenshot-capture/functions';
import { playSharedVideo, stopSharedVideo } from '../../react/features/shared-video/actions.any';
import { extractYoutubeIdOrURL } from '../../react/features/shared-video/functions';
import { toggleRequestingSubtitles, setRequestingSubtitles } from '../../react/features/subtitles/actions';
import { isAudioMuteButtonDisabled } from '../../react/features/toolbox/functions';
import { toggleTileView, setTileView } from '../../react/features/video-layout';
import { muteAllParticipants } from '../../react/features/video-menu/actions';
import { setVideoQuality } from '../../react/features/video-quality';
import VirtualBackgroundDialog from '../../react/features/virtual-background/components/VirtualBackgroundDialog';
import { getJitsiMeetTransport } from '../transport';

import { API_ID, ENDPOINT_TEXT_MESSAGE_NAME } from './constants';

import i18next from 'i18next';

const logger = Logger.getLogger(__filename);

const TEST_SOUND_PATH = 'sounds/ring.wav';

declare var APP: Object;
declare var interfaceConfig: Object;

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
            APP.conference.changeLocalDisplayName(displayName);
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
        'pin-participant': id => {
            logger.debug('Pin participant command received');
            sendAnalytics(createApiEvent('participant.pinned'));
            APP.store.dispatch(pinParticipant(id));
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
            logger.debug('Resize large video command received');
            sendAnalytics(createApiEvent('largevideo.resized'));
            APP.store.dispatch(resizeLargeVideo(width, height));
        },
        'send-tones': (options = {}) => {
            const { duration, tones, pause } = options;

            APP.store.dispatch(sendTones(tones, duration, pause));
        },
        'set-follow-me': value => {
            logger.debug('Set follow me command received');

            if (value) {
                sendAnalytics(createApiEvent('follow.me.set'));
            } else {
                sendAnalytics(createApiEvent('follow.me.unset'));
            }

            APP.store.dispatch(setFollowMe(value));
        },
        'set-large-video-participant': participantId => {
            logger.debug('Set large video participant command received');
            sendAnalytics(createApiEvent('largevideo.participant.set'));
            APP.store.dispatch(selectParticipantInLargeVideo(participantId));
        },
        'set-participant-volume': (participantId, volume) => {
            APP.store.dispatch(setVolume(participantId, volume));
        },
        'toggle-media-permission-screen': (visible, title, text) => {
            const browser = new BrowserDetection();

            APP.store.dispatch(mediaPermissionPromptVisibilityChanged(visible, browser.getName(), title, text));
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
            logger.log('Audio toggle: API command received');
            APP.conference.toggleAudioMuted(false /* no UI */);
        },
        'toggle-video': () => {
            sendAnalytics(createApiEvent('toggle-video'));
            logger.log('Video toggle: API command received');
            APP.conference.toggleVideoMuted(false /* no UI */);
        },
        'set-video-background-effect': options => {
            const jitsiTrack = getLocalJitsiVideoTrack(APP.store.getState());

            APP.store.dispatch(toggleBackgroundEffect(options, jitsiTrack));
        },
        'toggle-film-strip': () => {
            sendAnalytics(createApiEvent('film.strip.toggled'));
            APP.UI.toggleFilmstrip();
        },
        'toggle-camera': () => {
            if (!isToggleCameraEnabled(APP.store.getState())) {
                return;
            }

            APP.store.dispatch(toggleCamera());
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
        'toggle-subtitles': () => {
            APP.store.dispatch(toggleRequestingSubtitles());
        },
        'set-subtitles': enabled => {
            APP.store.dispatch(setRequestingSubtitles(enabled));
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
        'avatar-url': avatarUrl => {
            sendAnalytics(createApiEvent('avatar.url.changed'));
            APP.conference.changeLocalAvatarUrl(avatarUrl);
        },
        'send-chat-message': (message, to, ignorePrivacy = false) => {
            logger.debug('Send chat message command received');
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
            logger.debug('Send endpoint message command received');
            try {
                APP.conference.sendEndpointMessage(to, {
                    name: ENDPOINT_TEXT_MESSAGE_NAME,
                    text
                });
            } catch (err) {
                logger.error('Failed sending endpoint text message', err);
            }
        },
        'overwrite-names': participantList => {
            logger.debug('Overwrite names command received');

            APP.store.dispatch(overwriteParticipantsNames(participantList));
        },
        'toggle-e2ee': enabled => {
            logger.debug('Toggle E2EE key command received');
            APP.store.dispatch(toggleE2EE(enabled));
        },
        'set-media-encryption-key': keyInfo => {
            APP.store.dispatch(setMediaEncryptionKey(JSON.parse(keyInfo)));
        },
        'set-video-quality': frameHeight => {
            logger.debug('Set video quality command received');
            sendAnalytics(createApiEvent('set.video.quality'));
            APP.store.dispatch(setVideoQuality(frameHeight));
        },

        'start-share-video': url => {
            logger.debug('Share video command received');
            sendAnalytics(createApiEvent('share.video.start'));
            const id = extractYoutubeIdOrURL(url);

            if (id) {
                APP.store.dispatch(playSharedVideo(id));
            }
        },

        'stop-share-video': () => {
            logger.debug('Share video command received');
            sendAnalytics(createApiEvent('share.video.stop'));
            APP.store.dispatch(stopSharedVideo());
        },

        /**
         * Starts a file recording or streaming session depending on the passed on params.
         * For RTMP streams, `rtmpStreamKey` must be passed on. `rtmpBroadcastID` is optional.
         * For youtube streams, `youtubeStreamKey` must be passed on. `youtubeBroadcastID` is optional.
         * For dropbox recording, recording `mode` should be `file` and a dropbox oauth2 token must be provided.
         * For file recording, recording `mode` should be `file` and optionally `shouldShare` could be passed on.
         * No other params should be passed.
         *
         * @param { string } arg.mode - Recording mode, either `file` or `stream`.
         * @param { string } arg.dropboxToken - Dropbox oauth2 token.
         * @param { string } arg.rtmpStreamKey - The RTMP stream key.
         * @param { string } arg.rtmpBroadcastID - The RTMP braodcast ID.
         * @param { boolean } arg.shouldShare - Whether the recording should be shared with the participants or not.
         * Only applies to certain jitsi meet deploys.
         * @param { string } arg.youtubeStreamKey - The youtube stream key.
         * @param { string } arg.youtubeBroadcastID - The youtube broacast ID.
         * @returns {void}
         */
        'start-recording': ({
            mode,
            dropboxToken,
            shouldShare,
            rtmpStreamKey,
            rtmpBroadcastID,
            youtubeStreamKey,
            youtubeBroadcastID
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

            let recordingConfig;

            if (mode === JitsiRecordingConstants.mode.FILE) {
                if (dropboxToken) {
                    recordingConfig = {
                        mode: JitsiRecordingConstants.mode.FILE,
                        appData: JSON.stringify({
                            'file_recording_metadata': {
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
            } else {
                logger.error('Invalid recording mode provided');

                return;
            }

            if (isScreenshotCaptureEnabled(state, true, false)) {
                APP.store.dispatch(toggleScreenshotCaptureSummary(true));
            }
            conference.startRecording(recordingConfig);
        },

        /**
         * Stops a recording or streaming in progress.
         *
         * @param {string} mode - `file` or `stream`.
         * @returns {void}
         */
        'stop-recording': mode => {
            const state = APP.store.getState();
            const conference = getCurrentConference(state);

            if (!conference) {
                logger.error('Conference is not defined');

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

            APP.store.dispatch(overwriteConfig(whitelistedConfig));
        },
        'toggle-virtual-background': () => {
            APP.store.dispatch(toggleDialog(VirtualBackgroundDialog));
        },
        'play-test-sound': (deviceId) => {
            const audio = new Audio();
            audio.src = TEST_SOUND_PATH;

            audio.setSinkId(deviceId)
                .then(() => audio.play())
                .catch( err => logger.error('Could not set sink id', err));
        }
    };
    transport.on('event', ({ data, name }) => {
        if (name && commands[name]) {
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
            const tracks = getState()['features/base/tracks'];
            const sharingParticipantIds = tracks.filter(tr => tr.videoType === 'desktop').map(t => t.participantId);

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

        case 'get-speaker-stats':
            console.log("API - get-speaker-stats");
            console.log("API - speaker stats", APP.conference.getSpeakerStats());

            const stats = createSpeakerStats(APP.conference.getSpeakerStats());
            console.log("API - get-speaker-stats", stats);

            callback(stats);
            break;
        default:
            return false;
        }

        return true;
    });
}

function createSpeakerStats(stats) {
    const userIds = Object.keys(stats);
    const speakerStats = userIds.map(userId => {
        const userStats = createSpeakerStatsItem(stats[userId]);

        return {
            ...userStats, userId
        };
    });
    return speakerStats
}

function createSpeakerStatsItem(statsModel) {
    if (!statsModel) {
        return null;
    }

    const localParticipant = getLocalParticipant(APP.store.getState());
    const localDisplayName = localParticipant && localParticipant.name;

    const isDominantSpeaker = statsModel.isDominantSpeaker();
    const dominantSpeakerTime = statsModel.getTotalDominantSpeakerTime();
    const hasLeft = statsModel.hasLeft();

    let displayName;

    if (statsModel.isLocalStats()) {
        const meString = i18next.t('me');

        displayName = localDisplayName;
        displayName = displayName ? `${displayName} (${meString})` : meString;
    } else {
        displayName = statsModel.getDisplayName() || interfaceConfig.DEFAULT_REMOTE_DISPLAY_NAME;
    }

    return {
        displayName, dominantSpeakerTime, hasLeft, isDominantSpeaker
    };
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
function sanitizeMouseEvent(event: MouseEvent) {
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
    _enabled: boolean;

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
    }

    /**
     * Notify external application (if API is enabled) that the large video
     * visibility changed.
     *
     * @param {boolean} isHidden - True if the large video is hidden and false
     * otherwise.
     * @returns {void}
     */
    notifyLargeVideoVisibilityChanged(isHidden: boolean) {
        this._sendEvent({
            name: 'large-video-visibility-changed',
            isVisible: !isHidden
        });
    }

    /**
     * Notify external application (if API is enabled) that media devices
     * permissions are granted or not.
     *
     * @param {{audio: boolean, video: boolean}} permissions - Permissions per device type.
     * @returns {void}
     */
    notifyPermissionsGranted(permissions: Object) {
        this._sendEvent({
            name: 'permissions-granted',
            permissions
        });
    }

    /**
     * Notifies the external application (spot) that the local jitsi-participant
     * has a status update.
     *
     * @param {Object} event - The message to pass onto spot.
     * @returns {void}
     */
    sendProxyConnectionEvent(event: Object) {
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
    _sendEvent(event: Object = {}) {
        if (this._enabled) {
            transport.sendEvent(event);
        }
    }

    /**
     * Notify external application (if API is enabled) that the chat state has been updated.
     *
     * @param {number} unreadCount - The unread messages counter.
     * @param {boolean} isOpen - True if the chat panel is open.
     * @returns {void}
     */
    notifyChatUpdated(unreadCount: number, isOpen: boolean) {
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
    notifySendingChatMessage(message: string, privateMessage: boolean) {
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
    notifyMouseEnter(event: MouseEvent) {
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
    notifyMouseLeave(event: MouseEvent) {
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
    notifyMouseMove(event: MouseEvent) {
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
    notifyModerationChanged(mediaType: string, enabled: boolean) {
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
    notifyParticipantApproved(participantId: string, mediaType: string) {
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
    notifyParticipantRejected(participantId: string, mediaType: string) {
        this._sendEvent({
            name: 'moderation-participant-rejected',
            id: participantId,
            mediaType
        });
    }

    /**
     * Notify external application that the video quality setting has changed.
     *
     * @param {number} videoQuality - The video quality. The number represents the maximum height of the video streams.
     * @returns {void}
     */
    notifyVideoQualityChanged(videoQuality: number) {
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
            { body, id, nick, privateMessage, ts }: {
                body: *, id: string, nick: string, privateMessage: boolean, ts: *
            } = {}) {
        if (APP.conference.isLocalId(id)) {
            return;
        }

        this._sendEvent({
            name: 'incoming-message',
            from: id,
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
    notifyUserJoined(id: string, props: Object) {
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
    notifyUserLeft(id: string) {
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
    notifyUserRoleChanged(id: string, role: string) {
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
    notifyAvatarChanged(id: string, avatarURL: string) {
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
    notifyEndpointTextMessageReceived(data: Object) {
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
    notifyFaceLandmarkDetected(faceBox: Object, faceExpression: string) {
        this._sendEvent({
            name: 'face-landmark-detected',
            faceBox,
            faceExpression
        });
    }

    /**
     * Notify external application (if API is enabled) that the list of sharing participants changed.
     *
     * @param {Object} data - The event data.
     * @returns {void}
     */
    notifySharingParticipantsChanged(data: Object) {
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
    notifyDeviceListChanged(devices: Object) {
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
            id: string,
            { displayName, formattedDisplayName }: Object) {
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
            id: string,
            { email }: Object) {
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
     * @param {Array} args - Array of strings composing the log message.
     * @returns {void}
     */
    notifyLog(logLevel: string, args: Array<string>) {
        this._sendEvent({
            name: 'log',
            logLevel,
            args
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
    notifyConferenceJoined(roomName: string, id: string, props: Object) {
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
    notifyConferenceLeft(roomName: string) {
        this._sendEvent({
            name: 'video-conference-left',
            roomName
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
    notifyAudioMutedStatusChanged(muted: boolean) {
        this._sendEvent({
            name: 'audio-mute-status-changed',
            muted
        });
    }

    /**
     * Notify external application (if API is enabled) that audio input device level has changed.
     *
     * @param {Object} data - Track meta and audio level.
     * @returns {void}
     */
    notifyAudioLevelChanged(data: Object) {
        this._sendEvent({
            name: 'audio-level-changed',
            data
        });
    }

    /**
     * Notify external application (if API is enabled) that audio input device level does not receive data.
     *
     * @param {Object} data - Device id and is receiving data flag.
     * @returns {void}
     */
    notifyTrackReceivingStatus(data: Object) {
        this._sendEvent({
            name: 'track-receiving-data-status',
            data
        });
    }

    /**
     * Notify external application (if API is enabled) that a user is talking while he/she is muted.
     *
     * @returns {void}
     */
    notifyTalkWhileMuted() {
        this._sendEvent({
            name: 'talk-while-muted'
        });
    }

    /**
     * Notify external application (if API is enabled) for video muted status
     * changed.
     *
     * @param {boolean} muted - The new muted status.
     * @returns {void}
     */
    notifyVideoMutedStatusChanged(muted: boolean) {
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
    notifyAudioAvailabilityChanged(available: boolean) {
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
    notifyVideoAvailabilityChanged(available: boolean) {
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
    notifyOnStageParticipantChanged(id: string) {
        this._sendEvent({
            name: 'on-stage-participant-changed',
            id
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
    notifyOnCameraError(type: string, message: string) {
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
    notifyOnMicError(type: string, message: string) {
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
    notifyFeedbackSubmitted(error: string) {
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
    notifyFilmstripDisplayChanged(visible: boolean) {
        this._sendEvent({
            name: 'filmstrip-display-changed',
            visible
        });
    }

    /**
     * Notify external application (if API is enabled) that the iframe
     * docked state has been changed. The responsibility for implementing
     * the dock / undock functionality lies with the external application.
     *
     * @param {boolean} docked - Whether or not the iframe has been set to
     * be docked or undocked.
     * @returns {void}
     */
    notifyIframeDockStateChanged(docked: boolean) {
        this._sendEvent({
            name: 'iframe-dock-state-changed',
            docked
        });
    }

    /**
     * Notify external application of a participant, remote or local, being
     * removed from the conference by another participant.
     *
     * @param {string} kicked - The ID of the participant removed from the
     * conference.
     * @param {string} kicker - The ID of the participant that removed the
     * other participant.
     * @returns {void}
     */
    notifyKickedOut(kicked: Object, kicker: Object) {
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
    notifyScreenSharingStatusChanged(on: boolean, details: Object) {
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
    notifyDominantSpeakerChanged(id: string) {
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
    notifySubjectChanged(subject: string) {
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
    notifyTileViewChanged(enabled: boolean) {
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
    notifyLocalStorageChanged(localStorageContent: string) {
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
    notifyRaiseHandUpdated(id: string, handRaised: boolean) {
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
     * @param {string} mode - Stream or file.
     * @param {string} error - Error type or null if success.
     * @returns {void}
     */
    notifyRecordingStatusChanged(on: boolean, mode: string, error?: string) {
        this._sendEvent({
            name: 'recording-status-changed',
            on,
            mode,
            error
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
    notifyRecordingLinkAvailable(link: string, ttl: number) {
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
    notifyKnockingParticipant(participant: Object) {
        this._sendEvent({
            name: 'knocking-participant',
            participant
        });
    }

    /**
     * Notify external application (if API is enabled) that an error occured.
     *
     * @param {Object} error - The error.
     * @returns {void}
     */
    notifyError(error: Object) {
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
    notifyToolbarButtonClicked(key: string, preventExecution: boolean) {
        this._sendEvent({
            name: 'toolbar-button-clicked',
            key,
            preventExecution
        });
    }

    /**
     * Notify external application (if API is enabled) wether the used browser is supported or not.
     *
     * @param {boolean} supported - If browser is supported or not.
     * @returns {void}
     */
    notifyBrowserSupport(supported: boolean) {
        this._sendEvent({
            name: 'browser-support',
            supported
        });
    }

    /**
     * Notify external application that the breakout rooms changed.
     *
     * @param {Array} rooms - Array of breakout rooms.
     * @returns {void}
     */
    notifyBreakoutRoomsUpdated(rooms) {
        this._sendEvent({
            name: 'breakout-rooms-updated',
            rooms
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

    /**
     * Send notification to external application.
     *
     *@param {Object} props - Notification object.
     * @returns {void}
     */
    notifyExternal(props: Object = {}) {
        this._sendEvent({
            name: 'notification-raised',
            props
        });
    }
}

export default new API();
