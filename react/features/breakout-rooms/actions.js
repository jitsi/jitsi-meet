// @flow

import {
    BREAKOUT_ROOMS_UPDATED,
    BREAKOUT_ROOM_ADDED,
    BREAKOUT_ROOM_REMOVED,
    PARTICIPANT_SENT_TO_BREAKOUT_ROOM
} from './actionTypes';

/**
 * Action to update breakout rooms.
 *
 * @param {Object} breakoutRooms - The list of breakout rooms.
 * @returns {{
 *      type: BREAKOUT_ROOMS_UPDATED,
 *      breakoutRooms: Object,
 * }}
 */
export function updateBreakoutRooms(breakoutRooms: Object) {
    return {
        type: BREAKOUT_ROOMS_UPDATED,
        breakoutRooms
    };
}

/**
 * Action to add a breakout room.
 *
 * @param {string} breakoutRoomId - The breakout room id.
 * @returns {{
 *      type: BREAKOUT_ROOM_ADDED,
 *      breakoutRoom: Object,
 * }}
 */
export function addBreakoutRoom(breakoutRoomId: string) {
    return {
        type: BREAKOUT_ROOM_ADDED,
        breakoutRoomId
    };
}

/**
 * Action to remove a breakout room.
 *
 * @param {string} breakoutRoomId - The breakout room id.
 * @returns {{
 *      type: BREAKOUT_ROOM_REMOVED,
 *      breakoutRoom: Object,
 * }}
 */
export function removeBreakoutRoom(breakoutRoomId: string) {
    return {
        type: BREAKOUT_ROOM_REMOVED,
        breakoutRoomId
    };
}

/**
 * Action to move a participant to a breakout room.
 *
 * @param {string} participantId - The participant id.
 * @param {Object} breakoutRoom - The breakout room.
 * @returns {{
 *      type: PARTICIPANT_SENT_TO_BREAKOUT_ROOM,
 *      participantId: string,
 *      breakoutRoom: Object,
 * }}
 */
export function sendParticipantToBreakoutRoom(participantId: string, breakoutRoom: Object) {
    return {
        type: PARTICIPANT_SENT_TO_BREAKOUT_ROOM,
        participantId,
        breakoutRoom
    };
}
