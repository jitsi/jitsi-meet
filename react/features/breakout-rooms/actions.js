// @flow

import type { Dispatch } from 'redux';
import uuid from 'uuid';

import { openConnection } from '../../../connection';
import { getConferenceOptions } from '../conference/functions';

import {
    ADD_BREAKOUT_ROOM,
    CREATE_BREAKOUT_ROOM_CONNECTION,
    MOVE_TO_ROOM,
    REMOVE_BREAKOUT_ROOM,
    SEND_PARTICIPANT_TO_ROOM,
    UPDATE_BREAKOUT_ROOMS
} from './actionTypes';
import { selectBreakoutRoomsConnection, getMainRoomId } from './functions';

declare var APP: Object;

/**
 * Action to create a new breakout room.
 *
 * @returns {Function}
 */
export function createBreakoutRoom() {
    return async (dispatch: Dispatch<any>, getState: Function) => {
        const mainRoomId = getMainRoomId(getState());
        const breakoutRoomId = `${mainRoomId}-${uuid.v4()}`;

        await dispatch(_initBreakoutRoom(breakoutRoomId));
        dispatch({
            type: ADD_BREAKOUT_ROOM,
            breakoutRoomId
        });
    };
}

/**
 * Action to initialize a breakout room by joining as a fake moderator.
 * This allows other participants to join without waiting for a host.
 *
 * @param {string} breakoutRoomId - The id of the breakout room to initialize.
 * @returns {Function}
 */
function _initBreakoutRoom(breakoutRoomId) {
    return async (dispatch: Dispatch<any>, getState: Function) => {
        const state = getState();
        const conferenceOptions = getConferenceOptions(state);
        let connection = selectBreakoutRoomsConnection(state);

        if (!connection) {
            const mainRoomId = getMainRoomId(state);

            connection = await openConnection({
                retry: false,
                mainRoomId
            });

            const room = connection.initJitsiConference(mainRoomId, conferenceOptions);

            room.join();
            const fakeModeratorId = room.myUserId();

            dispatch({
                type: CREATE_BREAKOUT_ROOM_CONNECTION,
                connection,
                fakeModeratorId
            });
        }
        connection.initJitsiConference(breakoutRoomId, conferenceOptions).join();
    };
}

/**
 * Action to remove a breakout room.
 *
 * @param {string} breakoutRoomId - The breakout room id.
 * @returns {{
 *      type: REMOVE_BREAKOUT_ROOM,
 *      breakoutRoomId: string,
 * }}
 */
export function removeBreakoutRoom(breakoutRoomId: string) {
    return {
        type: REMOVE_BREAKOUT_ROOM,
        breakoutRoomId
    };
}

/**
 * Action to update breakout rooms.
 *
 * @param {Object} breakoutRooms - A list of breakout rooms.
 * @param {string} fakeModeratorId - The user id of the breakout rooms fake user.
 * @returns {{
 *      type: UPDATE_BREAKOUT_ROOMS,
 *      breakoutRooms: Object,
 *      fakeModeratorId: string
 * }}
 */
export function updateBreakoutRooms(breakoutRooms: Object, fakeModeratorId: string) {
    return {
        type: UPDATE_BREAKOUT_ROOMS,
        breakoutRooms,
        fakeModeratorId
    };
}

/**
 * Action to move to a room.
 *
 * @param {Object} roomId - The room id to move to. If empty move to the main room.
 * @returns {{
 *      type: MOVE_TO_ROOM,
 *      roomId: string,
 * }}
 */
export function moveToRoom(roomId?: string) {
    return {
        type: MOVE_TO_ROOM,
        roomId
    };
}

/**
 * Action to move to the main room.
 *
 * @returns {{
 *      type: MOVE_TO_ROOM,
 *      roomId: undefined,
 * }}
 */
export function moveToMainRoom() {
    return moveToRoom();
}

/**
 * Action to send a participant to a room.
 *
 * @param {string} participantId - The participant id.
 * @param {Object} roomId - The room id.
 * @returns {{
 *      type: SEND_PARTICIPANT_TO_ROOM,
 *      participantId: string,
 *      roomId: string,
 * }}
 */
export function sendParticipantToRoom(participantId: string, roomId: string) {
    return {
        type: SEND_PARTICIPANT_TO_ROOM,
        participantId,
        roomId
    };
}
