import { ReducerRegistry } from '../base/redux';

import { LANDING_IS_SHOWN } from './actionTypes';

ReducerRegistry.register('features/landing', (state = {}, action) => {
    switch (action.type) {
    case LANDING_IS_SHOWN:
        return {
            ...state,

            /**
             * Flag that shows that mobile landing is shown.
             *
             * @type {boolean}
             */
            landingIsShown: true
        };
    }

    return state;
});
