import { ReducerRegistry } from '../base/redux';
import {
    SET_FILMSTRIP_HOVERED,
    SET_FILMSTRIP_VISIBILITY
} from './actionTypes';

const DEFAULT_STATE = {
    visible: true
};

ReducerRegistry.register(
    'features/filmstrip',
    (state = DEFAULT_STATE, action) => {
        switch (action.type) {
        case SET_FILMSTRIP_HOVERED:
            return {
                ...state,
                hovered: action.hovered
            };

        case SET_FILMSTRIP_VISIBILITY:
            return {
                ...state,
                visible: action.visible
            };
        }

        return state;
    });
