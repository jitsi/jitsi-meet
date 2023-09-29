import ReducerRegistry from '../redux/ReducerRegistry';

import { SET_UNSAFE_ROOM_CONSENT } from './actionTypes';
import { IPreMeetingState } from './types';


const DEFAULT_STATE: IPreMeetingState = {
    unsafeRoomConsent: false
};

/**
 * Listen for actions which changes the state of known and used devices.
 *
 * @param {IDevicesState} state - The Redux state of the feature features/base/devices.
 * @param {Object} action - Action object.
 * @param {string} action.type - Type of action.
 * @returns {IPreMeetingState}
 */
ReducerRegistry.register<IPreMeetingState>(
    'features/base/premeeting',
    (state = DEFAULT_STATE, action): IPreMeetingState => {
        switch (action.type) {
        case SET_UNSAFE_ROOM_CONSENT: {
            return {
                ...state,
                unsafeRoomConsent: action.consent
            };
        }
        default:
            return state;
        }
    });

