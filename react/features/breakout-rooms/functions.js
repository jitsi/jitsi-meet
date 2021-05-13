// @flow

import { FEATURE_KEY } from './constants';

/**
 * Returns the main room id.
 *
 * @param {Object} state - Global state.
 * @returns {string} Room id of the main room or undefined.
 */
export const getMainRoomId = (state: Object) => {
    const pathname = state['features/base/connection']?.locationURL?.pathname;

    if (pathname) {
        // Remove the leading '/' from the pathname
        return pathname.slice(1);
    }

    return pathname;
};

/**
 * Selector for the list of breakout rooms.
 *
 * @param {Object} state - Global state.
 * @returns {Array<Object>} List of breakout rooms.
 */
export const selectBreakoutRooms = (state: Object) => state[FEATURE_KEY]?.breakoutRooms || [];

/**
 * Returns the connection used to join the breakout room by the creator.
 *
 * @param {Object} state - Global state.
 * @returns {Object} Connection object.
 */
export const selectBreakoutRoomsConnection = (state: Object) => state[FEATURE_KEY]?.connection;

/**
 * Returns the user id of the fake participant in breakout rooms.
 *
 * @param {Object} state - Global state.
 * @returns {string} User id.
 */
export const selectBreakoutRoomsFakeModeratorId = (state: Object) => state[FEATURE_KEY]?.fakeModeratorId;

/**
 * Returns a breakout room by id.
 *
 * @param {Object} state - Global state.
 * @param {string} breakoutRoomId - The breakout room id.
 * @returns {Object} Breakout room or undefined.
 */
export const getBreakoutRoom = (state: Object, breakoutRoomId: string) =>
    selectBreakoutRooms(state).find(room => room.id === breakoutRoomId);

/**
 * Get the id of the current room or undefined.
 *
 * @param {Object} state - Global state.
 * @returns {string} Room id.
 */
export const getCurrentRoomId = (state: Object) => {
    const { room } = state['features/base/conference'];

    return room;
};

/**
 * Get members of a room.
 *
 * @param {Object} state - Global state.
 * @param {string} roomId - The room id.
 * @returns {Array} List of room members.
 */
export const getRoomMembers = (state: Object, roomId: string) => {
    const { connection } = state['features/base/connection'];
    const muc = connection?.options?.hosts?.muc;
    const members = connection?.xmpp?.connection?.emuc?.rooms[`${roomId}@${muc}`]?.members;

    return members ? Object.values(members) : [];
};

/**
 * Determines whether the local participant is in a breakout room.
 *
 * @param {Object} state - Global state.
 * @returns {boolean}
 */
export const getIsInBreakoutRoom = (state: Object) => {
    const mainRoomId = getMainRoomId(state);
    const currentRoomId = getCurrentRoomId(state);

    return typeof currentRoomId !== 'undefined' && currentRoomId !== mainRoomId;
};
