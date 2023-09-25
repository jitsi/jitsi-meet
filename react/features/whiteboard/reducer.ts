import ReducerRegistry from '../base/redux/ReducerRegistry';

import { RESET_WHITEBOARD, SETUP_WHITEBOARD } from './actionTypes';

export interface IWhiteboardState {

    /**
     * The whiteboard collaboration details.
     */
    collabDetails?: { roomId: string; roomKey: string; };

    /**
     * The indicator which determines whether the whiteboard is open.
     *
     * @type {boolean}
     */
    isOpen: boolean;
}

const DEFAULT_STATE: IWhiteboardState = {
    isOpen: false,
    collabDetails: undefined
};

export interface IWhiteboardAction extends Partial<IWhiteboardState> {

    /**
     * The whiteboard collaboration details.
     */
    collabDetails?: { roomId: string; roomKey: string; };

    /**
     * The action type.
     */
    type: string;
}

ReducerRegistry.register(
    'features/whiteboard',
    (state: IWhiteboardState = DEFAULT_STATE, action: IWhiteboardAction) => {
        switch (action.type) {
        case SETUP_WHITEBOARD: {
            return {
                ...state,
                isOpen: true,
                collabDetails: action.collabDetails
            };
        }
        case RESET_WHITEBOARD:
            return DEFAULT_STATE;
        }

        return state;
    });
