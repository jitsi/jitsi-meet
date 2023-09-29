import md5 from 'js-md5';

import { getPinnedParticipant } from '../../features/base/participants/functions';
import { IReduxState } from '../app/types';
import { getCurrentConference } from '../base/conference/functions';
import { getRemoteParticipants, isLocalParticipantModerator } from '../base/participants/functions';
import { appendURLParam } from '../base/util/uri';
import { getCurrentRoomId, isInBreakoutRoom } from '../breakout-rooms/functions';

import { WHITEBOARD_ID } from './constants';
import { IWhiteboardState } from './reducer';

const getWhiteboardState = (state: IReduxState): IWhiteboardState => state['features/whiteboard'];

/**
 * Indicates whether the whiteboard is enabled in the config.
 *
 * @param {IReduxState} state - The state from the Redux store.
 * @returns {boolean}
 */
export const isWhiteboardEnabled = (state: IReduxState): boolean =>
    state['features/base/config'].whiteboard?.enabled
    && state['features/base/config'].whiteboard?.collabServerBaseUrl
    && getCurrentConference(state)?.getMetadataHandler()
?.isSupported();

/**
 * Indicates whether the whiteboard is open.
 *
 * @param {IReduxState} state - The state from the Redux store.
 * @returns {boolean}
 */
export const isWhiteboardOpen = (state: IReduxState): boolean => getWhiteboardState(state).isOpen;

/**
 * Indicates whether the whiteboard button is visible.
 *
 * @param {IReduxState} state - The state from the Redux store.
 * @returns {boolean}
 */
export const isWhiteboardButtonVisible = (state: IReduxState): boolean =>
    isWhiteboardEnabled(state) && (isLocalParticipantModerator(state) || isWhiteboardOpen(state));

/**
 * Indicates whether the whiteboard is present as a meeting participant.
 *
 * @param {IReduxState} state - The state from the Redux store.
 * @returns {boolean}
 */
export const isWhiteboardPresent = (state: IReduxState): boolean => getRemoteParticipants(state).has(WHITEBOARD_ID);

/**
 * Returns the whiteboard collaboration details.
 *
 * @param {IReduxState} state - The state from the Redux store.
 * @returns {{ roomId: string, roomKey: string}|undefined}
 */
export const getCollabDetails = (state: IReduxState): {
    roomId: string; roomKey: string;
} | undefined => getWhiteboardState(state).collabDetails;

/**
 * Returns the whiteboard collaboration server url.
 *
 * @param {IReduxState} state - The state from the Redux store.
 * @returns {string}
 */
export const getCollabServerUrl = (state: IReduxState): string | undefined => {
    const collabServerBaseUrl = state['features/base/config'].whiteboard?.collabServerBaseUrl;

    if (!collabServerBaseUrl) {
        return;
    }

    const { locationURL } = state['features/base/connection'];
    const inBreakoutRoom = isInBreakoutRoom(state);
    const roomId = getCurrentRoomId(state);
    const room = md5.hex(`${locationURL?.href}${inBreakoutRoom ? `|${roomId}` : ''}`);

    return appendURLParam(collabServerBaseUrl, 'room', room);
};

/**
 * Whether the whiteboard is visible on stage.
 *
 * @param {IReduxState} state - The state from the Redux store.
 * @returns {boolean}
 */
export const isWhiteboardVisible = (state: IReduxState): boolean =>
    getPinnedParticipant(state)?.id === WHITEBOARD_ID
    || state['features/large-video'].participantId === WHITEBOARD_ID;

/**
* Indicates whether the whiteboard is accessible to a participant that has a moderator role.
*
* @param {IReduxState} state - The state from the Redux store.
* @returns {boolean}
*/
export const isWhiteboardAllowed = (state: IReduxState): boolean =>
    isWhiteboardEnabled(state) && isLocalParticipantModerator(state);
