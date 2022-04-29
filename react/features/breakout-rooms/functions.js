// @flow

import _ from 'lodash';

import { getCurrentConference } from '../base/conference';
import { getParticipantCount, isLocalParticipantModerator } from '../base/participants';
import { toState } from '../base/redux';

import { FEATURE_KEY } from './constants';

/**
 * Returns the rooms object for breakout rooms.
 *
 * @param {Function|Object} stateful - The redux store, the redux
 * {@code getState} function, or the redux state itself.
 * @returns {Object} Object of rooms.
 */
export const getBreakoutRooms = (stateful: Function | Object) => toState(stateful)[FEATURE_KEY].rooms;

/**
 * Returns the main room.
 *
 * @param {Function|Object} stateful - The redux store, the redux
 * {@code getState} function, or the redux state itself.
 * @returns {Object|undefined} The main room object, or undefined.
 */
export const getMainRoom = (stateful: Function | Object) => {
    const rooms = getBreakoutRooms(stateful);

    return _.find(rooms, (room: Object) => room.isMainRoom);
};

/**
 * Returns the room by Jid.
 *
 * @param {Function|Object} stateful - The redux store, the redux
 * {@code getState} function, or the redux state itself.
 * @param {string} roomJid - The jid of the room.
 * @returns {Object|undefined} The main room object, or undefined.
 */
export const getRoomByJid = (stateful: Function | Object, roomJid: string): Object => {
    const rooms = getBreakoutRooms(stateful);

    return _.find(rooms, (room: Object) => room.jid === roomJid);
};

/**
 * Returns the id of the current room.
 *
 * @param {Function|Object} stateful - The redux store, the redux
 * {@code getState} function, or the redux state itself.
 * @returns {string} Room id or undefined.
 */
export const getCurrentRoomId = (stateful: Function | Object) => {
    const conference = getCurrentConference(stateful);

    // $FlowExpectedError
    return conference?.getName();
};

/**
 * Determines whether the local participant is in a breakout room.
 *
 * @param {Function|Object} stateful - The redux store, the redux
 * {@code getState} function, or the redux state itself.
 * @returns {boolean}
 */
export const isInBreakoutRoom = (stateful: Function | Object) => {
    const conference = getCurrentConference(stateful);

    // $FlowExpectedError
    return conference?.getBreakoutRooms()
        ?.isBreakoutRoom();
};

/**
 * Returns the breakout rooms config.
 *
 * @param {Function|Object} stateful - The redux store, the redux
 * {@code getState} function, or the redux state itself.
 * @returns {Object}
 */
export const getBreakoutRoomsConfig = (stateful: Function | Object) => {
    const state = toState(stateful);
    const { breakoutRooms = {} } = state['features/base/config'];

    return breakoutRooms;
};

/**
 * Returns whether the add breakout room button is visible.
 *
 * @param {Function | Object} stateful - Global state.
 * @returns {boolean}
 */
export const isAddBreakoutRoomButtonVisible = (stateful: Function | Object) => {
    const state = toState(stateful);
    const isLocalModerator = isLocalParticipantModerator(state);
    const { conference } = state['features/base/conference'];
    const isBreakoutRoomsSupported = conference?.getBreakoutRooms()?.isSupported();
    const { hideAddRoomButton } = getBreakoutRoomsConfig(state);

    return isLocalModerator && isBreakoutRoomsSupported && !hideAddRoomButton;
};

/**
 * Returns whether the auto assign participants to breakout rooms button is visible.
 *
 * @param {Function | Object} stateful - Global state.
 * @returns {boolean}
 */
export const isAutoAssignParticipantsVisible = (stateful: Function | Object) => {
    const state = toState(stateful);
    const rooms = getBreakoutRooms(state);
    const inBreakoutRoom = isInBreakoutRoom(state);
    const isLocalModerator = isLocalParticipantModerator(state);
    const participantsCount = getParticipantCount(state);
    const { hideAutoAssignButton } = getBreakoutRoomsConfig(state);

    return !inBreakoutRoom
        && isLocalModerator
        && participantsCount > 2
        && Object.keys(rooms).length > 1
        && !hideAutoAssignButton;
};
