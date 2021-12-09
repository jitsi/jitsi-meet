// @flow

import { JitsiConferenceEvents } from '../base/lib-jitsi-meet';
import { StateListenerRegistry } from '../base/redux';

import { UPDATE_BREAKOUT_ROOMS } from './actionTypes';
import { moveToRoom } from './actions';
import logger from './logger';

/**
 * Registers a change handler for state['features/base/conference'].conference to
 * set the event listeners needed for the breakout rooms feature to operate.
 */
StateListenerRegistry.register(
    state => state['features/base/conference'].conference,
    (conference, { dispatch }, previousConference) => {
        if (conference && !previousConference) {
            conference.on(JitsiConferenceEvents.BREAKOUT_ROOMS_MOVE_TO_ROOM, roomId => {
                logger.debug(`Moving to room: ${roomId}`);
                dispatch(moveToRoom(roomId));
            });

            conference.on(JitsiConferenceEvents.BREAKOUT_ROOMS_UPDATED, ({ rooms, roomCounter }) => {
                logger.debug('Room list updated');
                dispatch({
                    type: UPDATE_BREAKOUT_ROOMS,
                    rooms,
                    roomCounter
                });
            });
        }
    });
