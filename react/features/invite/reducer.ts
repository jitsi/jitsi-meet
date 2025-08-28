import ReducerRegistry from '../base/redux/ReducerRegistry';

import {
    ADD_PENDING_INVITE_REQUEST,
    REMOVE_PENDING_INVITE_REQUESTS,
    SET_CALLEE_INFO_VISIBLE,
    UPDATE_DIAL_IN_NUMBERS_FAILED,
    UPDATE_DIAL_IN_NUMBERS_SUCCESS
} from './actionTypes';
import logger from './logger';
import { IInvitee } from './types';

const DEFAULT_STATE = {
    /**
     * The indicator which determines whether (the) {@code CalleeInfo} is
     * visible.
     *
     * @type {boolean|undefined}
     */
    calleeInfoVisible: false,
    numbersEnabled: true,
    numbersFetched: false,
    pendingInviteRequests: []
};

export interface IInviteState {
    calleeInfoVisible?: boolean;
    conferenceID?: string | number;
    error?: {
        status: number;
    };
    initialCalleeInfo?: {
        id: string;
        name: string;
        status: string;
    };
    numbers?: string[];
    numbersEnabled: boolean;
    numbersFetched: boolean;
    pendingInviteRequests: Array<{
        callback: Function;
        invitees: IInvitee[];
    }>;
    sipUri?: string;
}

ReducerRegistry.register<IInviteState>('features/invite', (state = DEFAULT_STATE, action): IInviteState => {
    switch (action.type) {
    case ADD_PENDING_INVITE_REQUEST:
        return {
            ...state,
            pendingInviteRequests: [
                ...state.pendingInviteRequests,
                action.request
            ]
        };

    case REMOVE_PENDING_INVITE_REQUESTS:
        return {
            ...state,
            pendingInviteRequests: []
        };

    case SET_CALLEE_INFO_VISIBLE:
        return {
            ...state,
            calleeInfoVisible: action.calleeInfoVisible,
            initialCalleeInfo: action.initialCalleeInfo
        };

    case UPDATE_DIAL_IN_NUMBERS_FAILED:
        return {
            ...state,
            error: action.error
        };

    case UPDATE_DIAL_IN_NUMBERS_SUCCESS: {
        if (Array.isArray(action.dialInNumbers)) {
            return {
                ...state,
                conferenceID: action.conferenceID,
                error: undefined,
                numbers: action.dialInNumbers,
                sipUri: action.sipUri,
                numbersEnabled: true,
                numbersFetched: true
            };
        }

        // this is the old format which is deprecated
        logger.warn('Using deprecated API for retrieving phone numbers');

        const { numbersEnabled } = action.dialInNumbers;

        return {
            ...state,
            conferenceID: action.conferenceID,
            error: undefined,
            numbers: action.dialInNumbers,
            numbersEnabled,
            numbersFetched: true
        };
    }
    }

    return state;
});
