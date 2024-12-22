import { batch } from 'react-redux';

import { IStore } from '../app/types';
import { CONFERENCE_JOIN_IN_PROGRESS, CONFERENCE_LEFT } from '../base/conference/actionTypes';
import { getCurrentConference } from '../base/conference/functions';
import { IJitsiConference } from '../base/conference/reducer';
import { SET_CONFIG } from '../base/config/actionTypes';
import { MEDIA_TYPE } from '../base/media/constants';
import { PARTICIPANT_LEFT } from '../base/participants/actionTypes';
import { participantJoined, participantLeft, pinParticipant } from '../base/participants/actions';
import { getLocalParticipant, getParticipantById, getParticipantDisplayName } from '../base/participants/functions';
import { FakeParticipant } from '../base/participants/types';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import { SET_DYNAMIC_BRANDING_DATA } from '../dynamic-branding/actionTypes';
import { showWarningNotification } from '../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE } from '../notifications/constants';

import { RESET_SHARED_VIDEO_STATUS, SET_SHARED_VIDEO_STATUS } from './actionTypes';
import {
    hideConfirmPlayingDialog,
    resetSharedVideoStatus,
    setAllowedUrlDomians,
    setSharedVideoStatus,
    showConfirmPlayingDialog
} from './actions';
import {
    DEFAULT_ALLOWED_URL_DOMAINS,
    PLAYBACK_START,
    PLAYBACK_STATUSES,
    SHARED_VIDEO,
    VIDEO_PLAYER_PARTICIPANT_NAME
} from './constants';
import { isSharedVideoEnabled, isSharingStatus, isURLAllowedForSharedVideo, sendShareVideoCommand } from './functions';
import logger from './logger';


/**
 * Middleware that captures actions related to video sharing and updates
 * components not hooked into redux.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    const { dispatch, getState } = store;

    if (!isSharedVideoEnabled(getState())) {
        return next(action);
    }

    switch (action.type) {
    case CONFERENCE_JOIN_IN_PROGRESS: {
        const { conference } = action;
        const localParticipantId = getLocalParticipant(getState())?.id;

        conference.addCommandListener(SHARED_VIDEO,
            ({ value, attributes }: { attributes: {
                muted: string; state: string; time: string; }; value: string; },
            from: string) => {
                const state = getState();
                const sharedVideoStatus = attributes.state;

                const { ownerId } = state['features/shared-video'];

                if (ownerId && ownerId !== from) {
                    logger.warn(
                        `User with id: ${from} sent shared video command: ${sharedVideoStatus} while we are playing.`);

                    return;
                }

                if (isSharingStatus(sharedVideoStatus)) {
                    // confirmShowVideo is undefined the first time we receive
                    // when confirmShowVideo is false we ignore everything except stop that resets it
                    if (state['features/shared-video'].confirmShowVideo === false) {
                        return;
                    }

                    if (isURLAllowedForSharedVideo(value, state['features/shared-video'].allowedUrlDomains, true)
                        || localParticipantId === from
                        || state['features/shared-video'].confirmShowVideo) { // if confirmed skip asking again
                        handleSharingVideoStatus(store, value, {
                            ...attributes,
                            from
                        }, conference);
                    } else {
                        dispatch(showConfirmPlayingDialog(getParticipantDisplayName(state, from), () => {

                            handleSharingVideoStatus(store, value, {
                                ...attributes,
                                from
                            }, conference);

                            return true; // on mobile this is used to close the dialog
                        }));
                    }

                    return;
                }

                if (sharedVideoStatus === 'stop') {
                    const videoParticipant = getParticipantById(state, value);

                    if (state['features/shared-video'].confirmShowVideo === false) {
                        dispatch(showWarningNotification({
                            titleKey: 'dialog.shareVideoLinkStopped',
                            titleArguments: {
                                name: getParticipantDisplayName(state, from)
                            }
                        }, NOTIFICATION_TIMEOUT_TYPE.LONG));
                    }

                    dispatch(hideConfirmPlayingDialog());

                    dispatch(participantLeft(value, conference, {
                        fakeParticipant: videoParticipant?.fakeParticipant
                    }));

                    if (localParticipantId !== from) {
                        dispatch(resetSharedVideoStatus());
                    }
                }
            }
        );
        break;
    }
    case CONFERENCE_LEFT:
        dispatch(setAllowedUrlDomians(DEFAULT_ALLOWED_URL_DOMAINS));
        dispatch(resetSharedVideoStatus());
        break;
    case PARTICIPANT_LEFT: {
        const state = getState();
        const conference = getCurrentConference(state);
        const { ownerId: stateOwnerId, videoUrl: statevideoUrl } = state['features/shared-video'];

        if (action.participant.id === stateOwnerId) {
            batch(() => {
                dispatch(resetSharedVideoStatus());
                dispatch(participantLeft(statevideoUrl ?? '', conference));
            });
        }
        break;
    }
    case SET_CONFIG:
    case SET_DYNAMIC_BRANDING_DATA: {
        const result = next(action);
        const state = getState();
        const { sharedVideoAllowedURLDomains: allowedURLDomainsFromConfig = [] } = state['features/base/config'];
        const { sharedVideoAllowedURLDomains: allowedURLDomainsFromBranding = [] } = state['features/dynamic-branding'];

        dispatch(setAllowedUrlDomians([
            ...DEFAULT_ALLOWED_URL_DOMAINS,
            ...allowedURLDomainsFromBranding,
            ...allowedURLDomainsFromConfig
        ]));

        return result;
    }
    case SET_SHARED_VIDEO_STATUS: {
        const state = getState();
        const conference = getCurrentConference(state);
        const localParticipantId = getLocalParticipant(state)?.id;
        const { videoUrl, status, ownerId, time, muted, volume } = action;
        const operator = status === PLAYBACK_STATUSES.PLAYING ? 'is' : '';

        logger.debug(`User with id: ${ownerId} ${operator} ${status} video sharing.`);

        if (typeof APP !== 'undefined') {
            APP.API.notifyAudioOrVideoSharingToggled(MEDIA_TYPE.VIDEO, status, ownerId);
        }

        // when setting status we need to send the command for that, but not do it for the start command
        // as we are sending the command in playSharedVideo and setting the start status once
        // we receive the response, this way we will start the video at the same time when remote participants
        // start it, on receiving the command
        if (status === 'start') {
            break;
        }

        if (localParticipantId === ownerId) {
            sendShareVideoCommand({
                conference,
                localParticipantId,
                muted,
                status,
                time,
                id: videoUrl,
                volume
            });
        }
        break;
    }
    case RESET_SHARED_VIDEO_STATUS: {
        const state = getState();
        const localParticipantId = getLocalParticipant(state)?.id;
        const { ownerId: stateOwnerId, videoUrl: statevideoUrl } = state['features/shared-video'];

        if (!stateOwnerId) {
            break;
        }

        logger.debug(`User with id: ${stateOwnerId} stop video sharing.`);

        if (typeof APP !== 'undefined') {
            APP.API.notifyAudioOrVideoSharingToggled(MEDIA_TYPE.VIDEO, 'stop', stateOwnerId);
        }

        if (localParticipantId === stateOwnerId) {
            const conference = getCurrentConference(state);

            sendShareVideoCommand({
                conference,
                id: statevideoUrl ?? '',
                localParticipantId,
                muted: true,
                status: 'stop',
                time: 0,
                volume: 0
            });
        }
        break;
    }
    }

    return next(action);
});

/**
 * Handles the playing, pause and start statuses for the shared video.
 * Dispatches participantJoined event and, if necessary, pins it.
 * Sets the SharedVideoStatus if the event was triggered by the local user.
 *
 * @param {Store} store - The redux store.
 * @param {string} videoUrl - The id of the video to the shared.
 * @param {Object} attributes - The attributes received from the share video command.
 * @param {JitsiConference} conference - The current conference.
 * @returns {void}
 */
function handleSharingVideoStatus(store: IStore, videoUrl: string,
        { state, time, from, muted }: { from: string; muted: string; state: string; time: string; },
        conference: IJitsiConference) {
    const { dispatch, getState } = store;
    const localParticipantId = getLocalParticipant(getState())?.id;
    const oldStatus = getState()['features/shared-video']?.status ?? '';
    const oldVideoUrl = getState()['features/shared-video'].videoUrl;

    if (oldVideoUrl && oldVideoUrl !== videoUrl) {
        logger.warn(
            `User with id: ${from} sent videoUrl: ${videoUrl} while we are playing: ${oldVideoUrl}`);

        return;
    }

    // If the video was not started (no participant) we want to create the participant
    // this can be triggered by start, but also by paused or playing
    // commands (joining late) and getting the current state
    if (state === PLAYBACK_START || !isSharingStatus(oldStatus)) {
        const youtubeId = videoUrl.match(/http/) ? false : videoUrl;
        const avatarURL = youtubeId ? `https://img.youtube.com/vi/${youtubeId}/0.jpg` : '';

        dispatch(participantJoined({
            conference,
            fakeParticipant: FakeParticipant.SharedVideo,
            id: videoUrl,
            avatarURL,
            name: VIDEO_PLAYER_PARTICIPANT_NAME
        }));

        dispatch(pinParticipant(videoUrl));

        if (localParticipantId === from) {
            dispatch(setSharedVideoStatus({
                videoUrl,
                status: state,
                time: Number(time),
                ownerId: localParticipantId
            }));
        }
    }

    if (localParticipantId !== from) {
        dispatch(setSharedVideoStatus({
            muted: muted === 'true',
            ownerId: from,
            status: state,
            time: Number(time),
            videoUrl
        }));
    }
}
