// @flow

import i18next from 'i18next';
import _ from 'lodash';
import type { Dispatch } from 'redux';

import { createBreakoutRoomsEvent, sendAnalytics } from '../analytics';
import {
    conferenceLeft,
    conferenceWillLeave,
    createConference,
    getCurrentConference
} from '../base/conference';
import {
    MEDIA_TYPE,
    setAudioMuted,
    setVideoMuted
} from '../base/media';
import { getRemoteParticipants } from '../base/participants';
import {
    getLocalTracks,
    isLocalCameraTrackMuted,
    isLocalTrackMuted
} from '../base/tracks';
import { createDesiredLocalTracks } from '../base/tracks/actions';
import {
    NOTIFICATION_TIMEOUT_TYPE,
    clearNotifications,
    showNotification
} from '../notifications';

import { _RESET_BREAKOUT_ROOMS, _UPDATE_ROOM_COUNTER } from './actionTypes';
import { FEATURE_KEY } from './constants';
import {
    getBreakoutRooms,
    getMainRoom,
    getRoomByJid
} from './functions';
import logger from './logger';

declare var APP: Object;

/**
 * Action to create a breakout room.
 *
 * @param {string} name - Name / subject for the breakout room.
 * @returns {Function}
 */
export function createBreakoutRoom(name?: string) {
    return (dispatch: Dispatch<any>, getState: Function) => {
        const state = getState();
        let { roomCounter } = state[FEATURE_KEY];
        const subject = name || i18next.t('breakoutRooms.defaultName', { index: ++roomCounter });

        sendAnalytics(createBreakoutRoomsEvent('create'));

        dispatch({
            type: _UPDATE_ROOM_COUNTER,
            roomCounter
        });

        // $FlowExpectedError
        getCurrentConference(state)?.getBreakoutRooms()
            ?.createBreakoutRoom(subject);
    };
}

/**
 * Action to close a room and send participants to the main room.
 *
 * @param {string} roomId - The id of the room to close.
 * @returns {Function}
 */
export function closeBreakoutRoom(roomId: string) {
    return (dispatch: Dispatch<any>, getState: Function) => {
        const rooms = getBreakoutRooms(getState);
        const room = rooms[roomId];
        const mainRoom = getMainRoom(getState);

        sendAnalytics(createBreakoutRoomsEvent('close'));

        if (room && mainRoom) {
            Object.values(room.participants).forEach(p => {

                // $FlowExpectedError
                dispatch(sendParticipantToRoom(p.jid, mainRoom.id));
            });
        }
    };
}

/**
 * Action to remove a breakout room.
 *
 * @param {string} breakoutRoomJid - The jid of the breakout room to remove.
 * @returns {Function}
 */
export function removeBreakoutRoom(breakoutRoomJid: string) {
    return (dispatch: Dispatch<any>, getState: Function) => {
        sendAnalytics(createBreakoutRoomsEvent('remove'));
        const room = getRoomByJid(getState, breakoutRoomJid);

        if (!room) {
            logger.error('The room to remove was not found.');

            return;
        }

        if (Object.keys(room.participants).length > 0) {
            dispatch(closeBreakoutRoom(room.id));
        }

        // $FlowExpectedError
        getCurrentConference(getState)?.getBreakoutRooms()
            ?.removeBreakoutRoom(breakoutRoomJid);
    };
}

/**
 * Action to auto-assign the participants to breakout rooms.
 *
 * @returns {Function}
 */
export function autoAssignToBreakoutRooms() {
    return (dispatch: Dispatch<any>, getState: Function) => {
        const rooms = getBreakoutRooms(getState);
        const breakoutRooms = _.filter(rooms, (room: Object) => !room.isMainRoom);

        if (breakoutRooms) {
            sendAnalytics(createBreakoutRoomsEvent('auto.assign'));
            const participantIds = Array.from(getRemoteParticipants(getState).keys());
            const length = Math.ceil(participantIds.length / breakoutRooms.length);

            _.chunk(_.shuffle(participantIds), length).forEach((group, index) =>
                group.forEach(participantId => {
                    dispatch(sendParticipantToRoom(participantId, breakoutRooms[index].id));
                })
            );
        }
    };
}

/**
 * Action to send a participant to a room.
 *
 * @param {string} participantId - The participant id.
 * @param {string} roomId - The room id.
 * @returns {Function}
 */
export function sendParticipantToRoom(participantId: string, roomId: string) {
    return (dispatch: Dispatch<any>, getState: Function) => {
        const rooms = getBreakoutRooms(getState);
        const room = rooms[roomId];

        if (!room) {
            logger.warn(`Invalid room: ${roomId}`);

            return;
        }

        // Get the full JID of the participant. We could be getting the endpoint ID or
        // a participant JID. We want to find the connection JID.
        const participantJid = _findParticipantJid(getState, participantId);

        if (!participantJid) {
            logger.warn(`Could not find participant ${participantId}`);

            return;
        }

        // $FlowExpectedError
        getCurrentConference(getState)?.getBreakoutRooms()
            ?.sendParticipantToRoom(participantJid, room.jid);
    };
}

/**
 * Action to move to a room.
 *
 * @param {string} roomId - The room id to move to. If omitted move to the main room.
 * @returns {Function}
 */
export function moveToRoom(roomId?: string) {
    return async (dispatch: Dispatch<any>, getState: Function) => {
        const mainRoomId = getMainRoom(getState)?.id;
        let _roomId = roomId || mainRoomId;

        // Check if we got a full JID.
        // $FlowExpectedError
        if (_roomId?.indexOf('@') !== -1) {
            // $FlowExpectedError
            const [ id, ...domainParts ] = _roomId.split('@');

            // On mobile we first store the room and the connection is created
            // later, so let's attach the domain to the room String object as
            // a little hack.

            // eslint-disable-next-line no-new-wrappers
            _roomId = new String(id);

            // $FlowExpectedError
            _roomId.domain = domainParts.join('@');
        }

        // $FlowExpectedError
        const roomIdStr = _roomId?.toString();
        const goToMainRoom = roomIdStr === mainRoomId;
        const rooms = getBreakoutRooms(getState);
        const targetRoom = rooms[roomIdStr];

        if (!targetRoom) {
            logger.warn(`Unknown room: ${targetRoom}`);

            return;
        }

        dispatch({
            type: _RESET_BREAKOUT_ROOMS
        });

        if (navigator.product === 'ReactNative') {
            const conference = getCurrentConference(getState);
            const { audio, video } = getState()['features/base/media'];

            dispatch(conferenceWillLeave(conference));

            try {
                await conference.leave();
            } catch (error) {
                logger.warn('JitsiConference.leave() rejected with:', error);

                dispatch(conferenceLeft(conference));
            }

            dispatch(clearNotifications());

            // dispatch(setRoom(_roomId));
            dispatch(createConference(_roomId));
            dispatch(setAudioMuted(audio.muted));
            dispatch(setVideoMuted(video.muted));
            dispatch(createDesiredLocalTracks());
        } else {
            const localTracks = getLocalTracks(getState()['features/base/tracks']);
            const isAudioMuted = isLocalTrackMuted(localTracks, MEDIA_TYPE.AUDIO);
            const isVideoMuted = isLocalCameraTrackMuted(localTracks);

            try {
                // all places we fire notifyConferenceLeft we pass the room name from APP.conference
                await APP.conference.leaveRoom(false /* doDisconnect */).then(
                    () => APP.API.notifyConferenceLeft(APP.conference.roomName));
            } catch (error) {
                logger.warn('APP.conference.leaveRoom() rejected with:', error);

                // TODO: revisit why we don't dispatch CONFERENCE_LEFT here.
            }

            APP.conference.joinRoom(_roomId, {
                startWithAudioMuted: isAudioMuted,
                startWithVideoMuted: isVideoMuted
            });
        }

        if (goToMainRoom) {
            dispatch(showNotification({
                titleKey: 'breakoutRooms.notifications.joinedTitle',
                descriptionKey: 'breakoutRooms.notifications.joinedMainRoom',
                concatText: true,
                maxLines: 2
            }, NOTIFICATION_TIMEOUT_TYPE.MEDIUM));
        } else {
            dispatch(showNotification({
                titleKey: 'breakoutRooms.notifications.joinedTitle',
                descriptionKey: 'breakoutRooms.notifications.joined',
                descriptionArguments: { name: targetRoom.name },
                concatText: true,
                maxLines: 2
            }, NOTIFICATION_TIMEOUT_TYPE.MEDIUM));
        }
    };
}

/**
 * Finds a participant's connection JID given its ID.
 *
 * @param {Function} getState - The redux store state getter.
 * @param {string} participantId - ID of the given participant.
 * @returns {string|undefined} - The participant connection JID if found.
 */
function _findParticipantJid(getState: Function, participantId: string) {
    const conference = getCurrentConference(getState);

    if (!conference) {
        return;
    }

    // Get the full JID of the participant. We could be getting the endpoint ID or
    // a participant JID. We want to find the connection JID.
    let _participantId = participantId;
    let participantJid;

    if (!participantId.includes('@')) {
        const p = conference.getParticipantById(participantId);

        // $FlowExpectedError
        _participantId = p?.getJid(); // This will be the room JID.
    }

    if (_participantId) {
        const rooms = getBreakoutRooms(getState);

        for (const room of Object.values(rooms)) {
            // $FlowExpectedError
            const participants = room.participants || {};
            const p = participants[_participantId]

                // $FlowExpectedError
                || Object.values(participants).find(item => item.jid === _participantId);

            if (p) {
                participantJid = p.jid;
                break;
            }
        }
    }

    return participantJid;
}
