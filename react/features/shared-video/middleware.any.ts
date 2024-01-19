import { batch } from 'react-redux';

import { IStore } from '../app/types';
import { CONFERENCE_JOIN_IN_PROGRESS, CONFERENCE_LEFT } from '../base/conference/actionTypes';
import { getCurrentConference } from '../base/conference/functions';
import { IJitsiConference } from '../base/conference/reducer';
import { MEDIA_TYPE } from '../base/media/constants';
import { PARTICIPANT_LEFT } from '../base/participants/actionTypes';
import { participantJoined, participantLeft, pinParticipant } from '../base/participants/actions';
import { getLocalParticipant, getParticipantById } from '../base/participants/functions';
import { FakeParticipant } from '../base/participants/types';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';

import { RESET_SHARED_VIDEO_STATUS, SET_SHARED_VIDEO_STATUS } from './actionTypes';
import {
    resetSharedVideoStatus,
    setSharedVideoStatus
} from './actions.any';
import { PLAYBACK_STATUSES, SHARED_VIDEO, VIDEO_PLAYER_PARTICIPANT_NAME } from './constants';
import { isSharingStatus } from './functions';
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
    const state = getState();

    switch (action.type) {
    case CONFERENCE_JOIN_IN_PROGRESS: {
        const { conference } = action;
        const localParticipantId = getLocalParticipant(state)?.id;

        conference.addCommandListener(SHARED_VIDEO,
            ({ value, attributes }: { attributes: {
                from: string; muted: string; state: string; time: string; }; value: string; }) => {

                const { from } = attributes;
                const sharedVideoStatus = attributes.state;

                if (isSharingStatus(sharedVideoStatus)) {
                    handleSharingVideoStatus(store, value, attributes, conference);
                } else if (sharedVideoStatus === 'stop') {
                    const videoParticipant = getParticipantById(state, value);

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
        dispatch(resetSharedVideoStatus());
        break;
    case PARTICIPANT_LEFT: {
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
    case SET_SHARED_VIDEO_STATUS: {
        const conference = getCurrentConference(state);
        const localParticipantId = getLocalParticipant(state)?.id;
        const { videoUrl, status, ownerId, time, muted, volume } = action;
        const operator = status === PLAYBACK_STATUSES.PLAYING ? 'is' : '';

        logger.debug(`User with id: ${ownerId} ${operator} ${status} video sharing.`);

        if (typeof APP !== 'undefined') {
            APP.API.notifyAudioOrVideoSharingToggled(MEDIA_TYPE.VIDEO, status, ownerId);
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

    if (state === 'start' || ![ 'playing', 'pause', 'start' ].includes(oldStatus)) {
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

/* eslint-disable max-params */

/**
 * Sends SHARED_VIDEO command.
 *
 * @param {string} id - The id of the video.
 * @param {string} status - The status of the shared video.
 * @param {JitsiConference} conference - The current conference.
 * @param {string} localParticipantId - The id of the local participant.
 * @param {string} time - The seek position of the video.
 * @returns {void}
 */
function sendShareVideoCommand({ id, status, conference, localParticipantId = '', time, muted, volume }: {
    conference?: IJitsiConference; id: string; localParticipantId?: string; muted: boolean;
    status: string; time: number; volume: number;
}) {
    conference?.sendCommandOnce(SHARED_VIDEO, {
        value: id,
        attributes: {
            from: localParticipantId,
            muted,
            state: status,
            time,
            volume
        }
    });
}
