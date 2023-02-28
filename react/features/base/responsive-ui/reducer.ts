import ReducerRegistry from '../redux/ReducerRegistry';
import { set } from '../redux/functions';

import {
    CLIENT_RESIZED,
    SAFE_AREA_INSETS_CHANGED,
    SET_ASPECT_RATIO,
    SET_CONTEXT_MENU_OPEN,
    SET_NARROW_LAYOUT,
    SET_REDUCED_UI
} from './actionTypes';
import { ASPECT_RATIO_NARROW } from './constants';

const {
    innerHeight = 0,
    innerWidth = 0
} = window;

/**
 * The default/initial redux state of the feature base/responsive-ui.
 */
const DEFAULT_STATE = {
    aspectRatio: ASPECT_RATIO_NARROW,
    clientHeight: innerHeight,
    clientWidth: innerWidth,
    isNarrowLayout: false,
    reducedUI: false,
    contextMenuOpened: false
};

export interface IResponsiveUIState {
    aspectRatio: Symbol;
    clientHeight: number;
    clientWidth: number;
    contextMenuOpened: boolean;
    isNarrowLayout: boolean;
    reducedUI: boolean;
    safeAreaInsets?: {
        bottom: number;
        left: number;
        right: number;
        top: number;
    };
}

ReducerRegistry.register<IResponsiveUIState>('features/base/responsive-ui',
(state = DEFAULT_STATE, action): IResponsiveUIState => {
    switch (action.type) {
    case CLIENT_RESIZED: {
        return {
            ...state,
            clientWidth: action.clientWidth,
            clientHeight: action.clientHeight
        };
    }

    case SAFE_AREA_INSETS_CHANGED:
        return {
            ...state,
            safeAreaInsets: action.insets
        };

    case SET_ASPECT_RATIO:
        return set(state, 'aspectRatio', action.aspectRatio);

    case SET_REDUCED_UI:
        return set(state, 'reducedUI', action.reducedUI);

    case SET_CONTEXT_MENU_OPEN:
        return set(state, 'contextMenuOpened', action.isOpen);

    case SET_NARROW_LAYOUT:
        return set(state, 'isNarrowLayout', action.isNarrow);
    }

    return state;
});
