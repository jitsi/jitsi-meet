import { ReducerRegistry, set } from '../redux';

import { SET_ASPECT_RATIO } from './actionTypes';
import { ASPECT_RATIO_NARROW } from './constants';

const INITIAL_STATE = {
    aspectRatio: ASPECT_RATIO_NARROW
};

ReducerRegistry.register(
'features/base/aspect-ratio',
(state = INITIAL_STATE, action) => {
    switch (action.type) {
    case SET_ASPECT_RATIO:
        return set(state, 'aspectRatio', action.aspectRatio);
    }

    return state;
});
