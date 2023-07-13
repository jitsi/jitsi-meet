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

import { SET_SHARED_VIDEO_STATUS, RESET_SHARED_VIDEO_STATUS, REQUEST_SHARED_VIDEO_STATE } from './actionTypes';
import {
    resetSharedVideoStatus,
    setSharedVideoStatus
} from './actions.any';
import { SHARED_VIDEO, VIDEO_PLAYER_PARTICIPANT_NAME, REQUEST_SHARED_VIDEO_STATE_COMMAND } from './constants';
import { isSharingStatus, fetchStoppedVideoUrl } from './functions';

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
    const { videoUrl, status, ownerId, time, muted, volume, previousOwnerId } = action;
    const sharedVideoCurrentState = state['features/shared-video'];

    const getNewVideoOwnerId=(conference,localParticipantId)=>{
        const remoteParticipantIds = conference? Object.keys(conference.participants) : []
        const allParticipantIds=[localParticipantId,...remoteParticipantIds]
        allParticipantIds.sort(function (a, b) {
            return (a).localeCompare(b);
        })
        console.log('!!! All participant Ids ', allParticipantIds)
        console.log('!!! Local participant Id ', localParticipantId)

        return allParticipantIds[0].length>0 && allParticipantIds[0]
    }

    switch (action.type) {
    case CONFERENCE_LEFT:
        dispatch(resetSharedVideoStatus());
        break;

    case REQUEST_SHARED_VIDEO_STATE:
        sendRequestSharedVideoStateCommand(conference, videoUrl, localParticipantId)
        break;

    case PARTICIPANT_LEFT:

        const hasVideoOwnerLeft=action.participant.id === sharedVideoCurrentState.ownerId

        if (hasVideoOwnerLeft) {

            const newState={...sharedVideoCurrentState}

            if(conference && getNewVideoOwnerId(conference,localParticipantId)===localParticipantId)
            {
                newState.ownerId=localParticipantId
                newState.previousOwnerId=sharedVideoCurrentState.ownerId

                dispatch(setSharedVideoStatus({
                    ...newState
                    }))
            }
        }
        break;
    case SET_SHARED_VIDEO_STATUS:
        getNewVideoOwnerId(conference,localParticipantId)
        if (!Object.hasOwn(sharedVideoCurrentState, 'ownerId') || sharedVideoCurrentState.ownerId === '' || localParticipantId === sharedVideoCurrentState.ownerId) {
            sendShareVideoCommand({
                conference,
                localParticipantId,
                muted,
                status,
                time,
                id: videoUrl,
                ownerId,
                previousOwnerId
            });
        }
        break;
    case RESET_SHARED_VIDEO_STATUS:
        if (localParticipantId === sharedVideoCurrentState.ownerId) {
            sendShareVideoCommand({
                conference,
                id: sharedVideoCurrentState.videoUrl,
                localParticipantId,
                muted: true,
                status: 'stop',
                time: 0,
                ownerId:sharedVideoCurrentState.ownerId
            });
        }
        break;
    }

    return next(action);
});

/**
 * Set up state change listener to perform maintenance tasks when the conference
 * is left or failed, e.g. Clear messages or close the chat modal if it's left
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
                            fetchStoppedVideoUrl()
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
function handleSharingVideoStatus(store, videoUrl, { state, time, from, muted, ownerId, previousOwnerId }, conference) {

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
        const newState={
            muted: muted === 'true',
            ownerId: ownerId,
            status: state,
            time: Number(time),
            videoUrl,
            previousOwnerId
        }

        dispatch(setSharedVideoStatus(newState));
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
 * @param {string} ownerId - The id of video owner
 * @param {string} previousOwnerId - The id of the previous video

 * @returns {void}
 */
function sendShareVideoCommand({ id, status, conference, localParticipantId, time, muted, ownerId, previousOwnerId }) {
    conference.sendCommandOnce(SHARED_VIDEO, {

        value: id,
        attributes: {
            from: localParticipantId,
            muted,
            state: status,
            time,
            ownerId,
            previousOwnerId
        }
    });
}


/**
 * Sends REQUEST_SHARED_VIDEO_STATE_COMMAND command.
 *
 * @param {string} id - The id of the video.
 * @param {JitsiConference} conference - The current conference.
 * @param {string} localParticipantId - The id of the local participant.
 * @returns {void}
 */
function sendRequestSharedVideoStateCommand(conference, videoUrl, localParticipantId) {
    conference.sendCommandOnce(REQUEST_SHARED_VIDEO_STATE_COMMAND, {
        value: videoUrl,
        attributes: {
            from: localParticipantId
        }
    });
}

/**
 * Set up state change listener to receive reqeusts for shraed video state broadcast by the video owner
 */
StateListenerRegistry.register(
    state => getCurrentConference(state),
    (conference, store, previousConference) => {
        if (conference && conference !== previousConference) {
            conference.addCommandListener(REQUEST_SHARED_VIDEO_STATE_COMMAND,
                ({ value, attributes }) => {

                    const { dispatch, getState } = store;
                    const { from } = attributes;
                    const localParticipantId = getLocalParticipant(getState()).id;
                    const videoState = APP.store.getState()['features/shared-video']

                    if (videoState.status==='pause' && localParticipantId===videoState.ownerId && localParticipantId!==from) {
                        const newVideoState={...videoState, time:videoState.time+0.001}
                        dispatch(setSharedVideoStatus(newVideoState));
                    } 
                }
            );
        }
    }
);