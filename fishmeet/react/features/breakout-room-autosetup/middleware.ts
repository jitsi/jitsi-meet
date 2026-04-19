import { JitsiConferenceEvents } from '../base/lib-jitsi-meet';
import StateListenerRegistry from '../base/redux/StateListenerRegistry';
import logger from '../breakout-rooms/logger';
import type { IRooms } from '../breakout-rooms/types';

import { executeAutoBreakoutRoom, executeReassign, executeRemoveAllRooms, prepareReassignAdd, prepareReassignRemove } from './actions';

StateListenerRegistry.register(
    state => state['features/base/conference'].conference,
    (conference, { dispatch, getState }, previousConference) => {

        if (conference && !previousConference) {
            conference.on(JitsiConferenceEvents.BREAKOUT_ROOMS_UPDATED, (_params: {
                rooms: IRooms;
            }) => {
                const { availableToAutoSetup, availableToRemoveAllRooms, availableToReassign } = getState()['features/breakout-room-autosetup'];

                logger.debug('[GTS] StateListenerRegistry-autosetup Room Updated:', {
                    availableToAutoSetup,
                    availableToRemoveAllRooms,
                    ...availableToReassign
                });

                if (availableToAutoSetup) {
                    dispatch(executeAutoBreakoutRoom());
                }

                if (availableToRemoveAllRooms) {
                    dispatch(executeRemoveAllRooms());
                }

                if (availableToReassign.participantsReady && !availableToReassign.removeReady && !availableToReassign.addReady) {
                    dispatch(prepareReassignRemove(availableToReassign));
                }

                if (availableToReassign.participantsReady && availableToReassign.removeReady && !availableToReassign.addReady) {
                    dispatch(prepareReassignAdd(availableToReassign));
                }

                if (availableToReassign.participantsReady && availableToReassign.removeReady && availableToReassign.addReady) {
                    dispatch(executeReassign());
                }
            });
        }
    });
