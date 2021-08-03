// @flow

import i18next from 'i18next';
import _ from 'lodash';
import type { Dispatch } from 'redux';

import {
    conferenceLeft,
    conferenceWillLeave,
    createConference,
    getCurrentConference,
    setRoom
} from '../base/conference';
import { getRemoteParticipants } from '../base/participants';
import { getConferenceOptions } from '../conference/functions';
import { clearNotifications } from '../notifications';

import { UPDATE_BREAKOUT_ROOMS } from './actionTypes';
import {
    JSON_TYPE_ADD_BREAKOUT_ROOM,
    JSON_TYPE_MOVE_TO_ROOM_REQUEST,
    JSON_TYPE_REMOVE_BREAKOUT_ROOM
} from './constants';
import {
    getBreakoutRooms,
    getCurrentRoomId,
    getMainRoomId,
    isInBreakoutRoom
} from './functions';
import logger from './logger';

declare var APP: Object;

/**
 * Action to create a breakout room.
 *
 * @returns {Function}
 */
export function createBreakoutRoom() {
    return (dispatch: Dispatch<any>, getState: Function) => {
        const { nextIndex: index = 1, rooms } = getBreakoutRooms(getState);
        const message = {
            type: JSON_TYPE_ADD_BREAKOUT_ROOM,
            subject: i18next.t('breakoutRooms.defaultName', { index }),
            nextIndex: index + 1
        };

        dispatch({
            type: UPDATE_BREAKOUT_ROOMS,
            nextIndex: index + 1,
            rooms
        });
        getCurrentConference(getState).sendMessage(message, 'focus');
    };
}

/**
 * Action to close a room and send participants to a new room.
 *
 * @param {string} roomId - The id of the room to close.
 * @param {string} newRoomId - The id of the room that the participants should move to.
 * If empty, the participants will be sent to the main room.
 * @returns {Function}
 */
export function closeRoom(roomId: string, newRoomId?: string) {
    return (dispatch: Dispatch<any>, getState: Function) => {
        const { rooms = {} } = getBreakoutRooms(getState);
        const { participants = {} } = rooms[roomId];
        const _newRoomId = newRoomId || getMainRoomId(getState);

        Object.keys(participants).forEach(participantId =>
            dispatch(sendParticipantToRoom(participantId, _newRoomId))
        );
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
        const message = {
            type: JSON_TYPE_REMOVE_BREAKOUT_ROOM,
            breakoutRoomJid
        };

        getCurrentConference(getState).sendMessage(message, 'focus');
    };
}


/**
 * Action to auto-assign the participants to breakout rooms.
 *
 * @returns {Function}
 */
export function autoAssignToBreakoutRooms() {
    return (dispatch: Dispatch<any>, getState: Function) => {
        const { rooms = {} } = getBreakoutRooms(getState);
        const breakoutRooms = _.filter(rooms, (room: Object) => !room.isMainRoom);

        if (breakoutRooms) {
            const participantIds = Array.from(getRemoteParticipants(getState).keys());
            const length = Math.ceil(participantIds.length / breakoutRooms.length);

            _.chunk(_.shuffle(participantIds), length).forEach((group, index) =>
                group.forEach(participantId =>
                    dispatch(sendParticipantToRoom(participantId, breakoutRooms[index].id))
                )
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
        const conferenceOptions = getConferenceOptions(getState);
        const fullJid = participantId.indexOf('@') >= 0
            ? participantId
            : `${getCurrentRoomId(getState)}@${isInBreakoutRoom(getState)
                ? `breakout.${conferenceOptions.hosts.domain}`
                : conferenceOptions.hosts.muc
            }/${participantId}`;
        const message = {
            type: JSON_TYPE_MOVE_TO_ROOM_REQUEST,
            roomId
        };

        getCurrentConference(getState).sendMessage(message, fullJid);
    };
}

/**
 * Action to move to a room.
 *
 * @param {string} roomId - The room id to move to. If omitted move to the main room.
 * @returns {Function}
 */
export function moveToRoom(roomId?: string) {
    return (dispatch: Dispatch<any>, getState: Function) => {
        const _roomId = roomId || getMainRoomId(getState);

        if (navigator.product === 'ReactNative') {
            const conference = getCurrentConference(getState);

            dispatch(conferenceWillLeave(conference));
            conference.leave()
            .catch(error => {
                logger.warn(
                    'JitsiConference.leave() rejected with:',
                    error);

                dispatch(conferenceLeft(conference));
            });
            dispatch(clearNotifications());
            dispatch(setRoom(_roomId));
            dispatch(createConference());
        } else {
            const join = () => APP.conference.joinRoom(_roomId);

            APP.conference.leaveRoom()
            .then(join, join);
        }
    };
}
