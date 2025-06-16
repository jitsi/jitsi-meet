import ReducerRegistry from '../base/redux/ReducerRegistry';

import {
    ADD_GIF_FOR_PARTICIPANT,
    HIDE_GIF_FOR_PARTICIPANT,
    REMOVE_GIF_FOR_PARTICIPANT,
    SET_GIF_MENU_VISIBILITY
} from './actionTypes';

const initialState = {
    gifList: new Map(),
    menuOpen: false
};

export interface IGif {
    gifUrl?: string;
    timeoutID?: number;
}

export interface IGifsState {
    gifList: Map<string, IGif>;
    menuOpen: boolean;
}

ReducerRegistry.register<IGifsState>(
    'features/gifs',
    (state = initialState, action): IGifsState => {
        switch (action.type) {
        case ADD_GIF_FOR_PARTICIPANT: {
            const newList = state.gifList;

            newList.set(action.participantId, {
                gifUrl: action.gifUrl,
                timeoutID: action.timeoutID
            });

            return {
                ...state,
                gifList: newList
            };
        }
        case REMOVE_GIF_FOR_PARTICIPANT: {
            const newList = state.gifList;

            newList.delete(action.participantId);

            return {
                ...state,
                gifList: newList
            };
        }
        case HIDE_GIF_FOR_PARTICIPANT: {
            const newList = state.gifList;
            const gif = state.gifList.get(action.participantId);

            newList.set(action.participantId, {
                gifUrl: gif?.gifUrl ?? '',
                timeoutID: action.timeoutID
            });

            return {
                ...state,
                gifList: newList
            };
        }
        case SET_GIF_MENU_VISIBILITY:
            return {
                ...state,
                menuOpen: action.visible
            };
        }

        return state;
    });

