// @flow

import _ from 'lodash';

import { getCurrentConference } from '../base/conference';
import { toState } from '../base/redux';

import { FEATURE_KEY } from './constants';

/**
 * Returns the state of the breakout rooms feature.
 *
 * @param {Function|Object} stateful - The redux store, the redux
 * {@code getState} function, or the redux state itself.
 * @returns {Object} Breakout rooms feature state.
 */
export const getBreakoutRooms = (stateful: Function | Object) => toState(stateful)[FEATURE_KEY] || {};

/**
 * Returns the rooms object.
 *
 * @param {Function|Object} stateful - The redux store, the redux
 * {@code getState} function, or the redux state itself.
 * @returns {Object} Object of rooms.
 */
export const getRooms = (stateful: Function | Object) => {
    const { rooms = {} } = getBreakoutRooms(stateful);

    return rooms;
};

/**
 * Returns the main room id.
 *
 * @param {Function|Object} stateful - The redux store, the redux
 * {@code getState} function, or the redux state itself.
 * @returns {string} Id of the main room or undefined.
 */
export const getMainRoomId = (stateful: Function | Object) => {
    const rooms = getRooms(stateful);

    return _.find(rooms, (room: Object) => room.isMainRoom)?.id;
};

/**
 * Returns the id of the current room.
 *
 * @param {Function|Object} stateful - The redux store, the redux
 * {@code getState} function, or the redux state itself.
 * @returns {string} Room id or undefined.
 */
export const getCurrentRoomId = (stateful: Function | Object) =>
getCurrentConference(stateful)?.options?.name;

/**
 * Get participants in a room.
 *
 * @param {Function|Object} stateful - The redux store, the redux
 * {@code getState} function, or the redux state itself.
 * @param {string} roomId - The room id.
 * @returns {Object} Object of participants.
 */
export const getRoomParticipants = (stateful: Function | Object, roomId: string) =>
    getRooms(stateful)[roomId]?.participants || {};

/**
 * Determines whether the local participant is in a breakout room.
 *
 * @param {Function|Object} stateful - The redux store, the redux
 * {@code getState} function, or the redux state itself.
 * @returns {boolean}
 */
export const isInBreakoutRoom = (stateful: Function | Object) => {
    const mainRoomId = getMainRoomId(stateful);
    const currentRoomId = getCurrentRoomId(stateful);

    return typeof mainRoomId !== 'undefined' && mainRoomId !== currentRoomId;
};
