// @flow

import { batch } from 'react-redux';

import { CONFERENCE_LEFT, getCurrentConference } from '../base/conference';
import {
    PARTICIPANT_LEFT,
    getLocalParticipant,
    participantJoined,
    participantLeft,
    pinParticipant
} from '../base/participants';
import { MiddlewareRegistry, StateListenerRegistry } from '../base/redux';

import { SET_SHARED_VIDEO_STATUS, RESET_SHARED_VIDEO_STATUS } from './actionTypes';
import {
    resetSharedVideoStatus,
    setSharedVideoStatus
} from './actions.any';
import { SHARED_VIDEO, VIDEO_PLAYER_PARTICIPANT_NAME } from './constants';
import { isSharingStatus } from './functions';

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
    const conference = getCurrentConference(state);
    const localParticipantId = getLocalParticipant(state)?.id;
    const { videoUrl, status, ownerId, time, muted, volume } = action;
    const { ownerId: stateOwnerId, videoUrl: statevideoUrl } = state['features/shared-video'];

    switch (action.type) {
    case CONFERENCE_LEFT:
        dispatch(resetSharedVideoStatus());
        break;
    case PARTICIPANT_LEFT:
        if (action.participant.id === stateOwnerId) {
            batch(() => {
                dispatch(resetSharedVideoStatus());
                dispatch(participantLeft(statevideoUrl, conference));
            });
        }
        break;
    case SET_SHARED_VIDEO_STATUS:
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
    case RESET_SHARED_VIDEO_STATUS:
        if (localParticipantId === stateOwnerId) {
            sendShareVideoCommand({
                conference,
                id: statevideoUrl,
                localParticipantId,
                muted: true,
                status: 'stop',
                time: 0,
                volume: 0
            });
        }
        break;
    }

    return next(action);
});

/**
 * Set up state change listener to perform maintenance tasks when the conference
 * is left or failed, e.g. clear messages or close the chat modal if it's left
 * open.
 */
StateListenerRegistry.register(
    state => getCurrentConference(state),
    (conference, store, previousConference) => {
        if (conference && conference !== previousConference) {
            conference.addCommandListener(SHARED_VIDEO,
                ({ value, attributes }) => {

                    const { dispatch, getState } = store;
                    const { from } = attributes;
                    const localParticipantId = getLocalParticipant(getState()).id;
                    const status = attributes.state;

                    if (isSharingStatus(status)) {
                        handleSharingVideoStatus(store, value, attributes, conference);
                    } else if (status === 'stop') {
                        dispatch(participantLeft(value, conference));
                        if (localParticipantId !== from) {
                            dispatch(resetSharedVideoStatus());
                        }
                    }
                }
            );
        }
    }
);

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
function handleSharingVideoStatus(store, videoUrl, { state, time, from, muted }, conference) {
    const { dispatch, getState } = store;
    const localParticipantId = getLocalParticipant(getState()).id;
    const oldStatus = getState()['features/shared-video']?.status;

    if (state === 'start' || ![ 'playing', 'pause', 'start' ].includes(oldStatus)) {
        const youtubeId = videoUrl.match(/http/) ? false : videoUrl;
        const avatarURL = youtubeId ? `https://img.youtube.com/vi/${youtubeId}/0.jpg` : '';

        dispatch(participantJoined({
            conference,
            id: videoUrl,
            isFakeParticipant: true,
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
function sendShareVideoCommand({ id, status, conference, localParticipantId, time, muted, volume }) {
    conference.sendCommandOnce(SHARED_VIDEO, {
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
