import { ReducerRegistry, set } from '../redux';

import { SET_ASPECT_RATIO, SET_REDUCED_UI } from './actionTypes';
import { ASPECT_RATIO_NARROW } from './constants';

/**
 * The initial redux state of the feature base/responsive-ui.
 */
const _INITIAL_STATE = {
    aspectRatio: ASPECT_RATIO_NARROW,
    reducedUI: false
};

ReducerRegistry.register(
    'features/base/responsive-ui',
    (state = _INITIAL_STATE, action) => {
        switch (action.type) {
        case SET_ASPECT_RATIO:
            return set(state, 'aspectRatio', action.aspectRatio);

        case SET_REDUCED_UI:
            return set(state, 'reducedUI', action.reducedUI);
        }

        return state;
    });
