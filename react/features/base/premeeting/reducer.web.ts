import ReducerRegistry from '../redux/ReducerRegistry';

import { SET_PRECALL_TEST_RESULTS, SET_UNSAFE_ROOM_CONSENT } from './actionTypes';
import { IPreMeetingState, PreCallTestStatus } from './types';


const DEFAULT_STATE: IPreMeetingState = {
    preCallTestState: {
        status: PreCallTestStatus.INITIAL
    },
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
        case SET_PRECALL_TEST_RESULTS:
            return {
                ...state,
                preCallTestState: action.value
            };

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

