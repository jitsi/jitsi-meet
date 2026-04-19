import { size } from 'lodash-es';

import { APP_WILL_MOUNT, APP_WILL_UNMOUNT } from '../base/app/actionTypes';
import { CONFERENCE_JOINED } from '../base/conference/actionTypes';
import { JitsiConferenceEvents } from '../base/lib-jitsi-meet';
import { PARTICIPANT_JOINED } from '../base/participants/actionTypes';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import StateListenerRegistry from '../base/redux/StateListenerRegistry';
import logger from '../breakout-rooms/logger';
import type { IRooms } from '../breakout-rooms/types';

import { cleanListener, enablePresetFeature, executeBreakoutRoom, prepareBreakoutRoom, retrievePresetBreakoutRoom } from './actions';
import { getAllParticipants, isEnablePreBreakout } from './functions';

MiddlewareRegistry.register(store => next => action => {
    const { dispatch, getState } = store;
    const result = next(action);

    switch (action.type) {
    case APP_WILL_MOUNT:
        const { search, hash } = location;
        const isEnable = isEnablePreBreakout(search);

        dispatch(enablePresetFeature(isEnable));
        if (isEnable) {
            dispatch(retrievePresetBreakoutRoom());
        }
        logger.debug('[GTS-PBR] APP_WILL_MOUNT', { search, hash, isEnable });
        break;

    case APP_WILL_UNMOUNT:
        dispatch(cleanListener());
        logger.debug('[GTS-PBR] APP_WILL_UNMOUNT');
        break;

    case CONFERENCE_JOINED:
        const allParticipants = getAllParticipants(getState);

        logger.debug('[GTS-PBR] CONFERENCE_JOINED', { allParticipants });
        break;

    case PARTICIPANT_JOINED:
        logger.debug('[GTS-PBR] MiddlewareRegistry PARTICIPANT_JOINED', { action });
        break;
    }

    return result;
});


StateListenerRegistry.register(
    state => state['features/base/conference'].conference,
    (conference, { dispatch, getState }, previousConference) => {

        if (conference && !previousConference) {
            conference.on(JitsiConferenceEvents.USER_JOINED, (_id: string, user: any) => {
                logger.debug('[GTS] StateListenerRegistry PARTICIPANT_JOINED', { _id, user });
            });

            conference.on(JitsiConferenceEvents.BREAKOUT_ROOMS_UPDATED, ({ roomCounter, rooms }: {
                roomCounter: number; rooms: IRooms;
            }) => {
                const { availableToSetup } = getState()['features/breakout-room-presetup'];
                const { roomCounter: prevRoomCounter, rooms: prevRooms } = getState()['features/breakout-rooms'];

                logger.debug('[GTS] StateListenerRegistry-presetup Room Updated:', {
                    availableToSetup,
                    roomCounter,
                    rooms,
                    prev: {
                        roomCounter: prevRoomCounter,
                        rooms: prevRooms,
                        size: size(prevRooms)
                    },
                    next: {
                        roomCounter: roomCounter,
                        rooms,
                        size: size(rooms)
                    }
                });

                if (availableToSetup.participantsReady && availableToSetup.cleanRoomReady && !availableToSetup.createRoomReady) {
                    dispatch(prepareBreakoutRoom());
                }

                if (availableToSetup.participantsReady && availableToSetup.cleanRoomReady && availableToSetup.createRoomReady) {
                    dispatch(executeBreakoutRoom());
                }
            });
        }
    });
