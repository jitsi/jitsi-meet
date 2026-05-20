import ReducerRegistry from '../base/redux/ReducerRegistry';

import { RESET_WHITEBOARD, SETUP_WHITEBOARD, SET_WHITEBOARD_OPEN } from './actionTypes';

export interface IWhiteboardState {

    /**
     * The whiteboard collaboration details.
     */
    collabDetails?: { roomId: string; roomKey: string; };

    /**
     * The whiteboard collaboration url.
     */
    collabServerUrl?: string;

    /**
     * The indicator which determines whether the whiteboard is open.
     *
     * @type {boolean}
     */
    isOpen: boolean;

    /**
     * Whether the whiteboard was opened by the local participant.
     */
    openedLocally: boolean;
}

const DEFAULT_STATE: IWhiteboardState = {
    isOpen: false,
    collabDetails: undefined,
    collabServerUrl: undefined,
    openedLocally: false
};

export interface IWhiteboardAction extends Partial<IWhiteboardState> {

    /**
     * The whiteboard collaboration details.
     */
    collabDetails?: { roomId: string; roomKey: string; };

    /**
     * The whiteboard collaboration url.
     */
    collabServerUrl?: string;

    /**
     * Whether the whiteboard was opened by the local participant.
     */
    openedLocally?: boolean;

    /**
     * The action type.
     */
    type: string;

    /**
     * Whether the action was triggered by a user interaction.
     */
    userInitiated?: boolean;
}

ReducerRegistry.register(
    'features/whiteboard',
    (state: IWhiteboardState = DEFAULT_STATE, action: IWhiteboardAction) => {
        switch (action.type) {
        case SETUP_WHITEBOARD: {
            return {
                ...state,
                collabDetails: action.collabDetails,
                collabServerUrl: action.collabServerUrl,
                openedLocally: action.openedLocally ?? state.openedLocally
            };
        }
        case SET_WHITEBOARD_OPEN: {
            return {
                ...state,
                isOpen: Boolean(action.isOpen)
            };
        }
        case RESET_WHITEBOARD:
            return DEFAULT_STATE;
        }

        return state;
    });
