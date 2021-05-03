import { useSelector } from 'react-redux';
import uuid from 'uuid';

import getRoomName from '../base/config/getRoomName';

import { REDUCER_KEY } from './constants';


/**
 * Generates a breakout room id.
 *
 * @returns {string} Room id.
 */
export const getBreakoutRooms = () => {
    const { breakoutRooms } = useSelector(state => state[REDUCER_KEY]);

    return breakoutRooms || [];
};


/**
 * Get members of a breakout room.
 *
 * @param {string} breakoutRoomId - The breakout room id.
 * @returns {Array} List of room members.
 */
export const getBreakoutRoomMembers = breakoutRoomId => {
    const { connection } = useSelector(state => state['features/base/connection']);
    const muc = connection?.options?.hosts?.muc;
    const members = connection?.xmpp?.connection?.emuc?.rooms[`${breakoutRoomId}@${muc}`]?.members;

    return members ? Object.values(members) : [];
};


/**
 * Generates a breakout room id.
 *
 * @returns {string} Room id.
 */
export const getNewBreakoutRoomId = () => {
    const mainRoom = getRoomName();

    return `${mainRoom}-${uuid.v4()}`;
};

/**
 * Get current breakout room.
 *
 * @returns {Object} Breakout room.
 */
export const getCurrentBreakoutRoom = () => {
    const { conference } = useSelector(state => state['features/base/conference']);
    const currentRoomId = conference?.options?.name;

    return getBreakoutRooms().find(room => room.id === currentRoomId) || null;
};

/**
 * Determines whether the local participant is in a breakout room.
 *
 * @returns {boolean}
 */
export const getIsInBreakoutRoom = () => {
    const mainRoom = getRoomName();
    const currentBreakoutRoom = getCurrentBreakoutRoom();

    return currentBreakoutRoom !== null && currentBreakoutRoom?.id !== mainRoom;
};


/**
 * Generates a class attribute value.
 *
 * @param {Iterable<string>} args - String iterable.
 * @returns {string} Class attribute value.
 */
export const classList = (...args) => args.filter(Boolean).join(' ');


/**
 * Find the first styled ancestor component of an element.
 *
 * @param {Element} target - Element to look up.
 * @param {StyledComponentClass} component - Styled component reference.
 * @returns {Element|null} Ancestor.
 */
export const findStyledAncestor = (target, component) => {
    if (!target || target.matches(`.${component.styledComponentId}`)) {
        return target;
    }

    return findStyledAncestor(target.parentElement, component);
};

/**
 * Get a style property from a style declaration as a float.
 *
 * @param {CSSStyleDeclaration} styles - Style declaration.
 * @param {string} name - Property name.
 * @returns {number} Float value.
 */
export const getFloatStyleProperty = (styles, name) =>
    parseFloat(styles.getPropertyValue(name));

/**
 * Gets the outer height of an element, including margins.
 *
 * @param {Element} element - Target element.
 * @returns {number} Computed height.
 */
export const getComputedOuterHeight = element => {
    const computedStyle = getComputedStyle(element);

    return element.offsetHeight
    + getFloatStyleProperty(computedStyle, 'margin-top')
    + getFloatStyleProperty(computedStyle, 'margin-bottom');
};

/**
 * Returns this feature's root state.
 *
 * @param {Object} state - Global state.
 * @returns {Object} Feature state.
 */
export const getState = state => state[REDUCER_KEY];
