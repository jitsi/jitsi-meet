import { setUserFilmstripWidth } from '../../filmstrip/actions.web';
import MiddlewareRegistry from '../redux/MiddlewareRegistry';
import { updateSettings } from '../settings/actions';

import { SET_CONFIG } from './actionTypes';
import './middleware.any';

/**
 * The middleware of the feature {@code base/config}.
 *
 * @param {Store} store - The redux store.
 * @private
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    const result = next(action);

    switch (action.type) {
    case SET_CONFIG: {
        const { initialWidth, stageFilmstripParticipants } = action.config.filmstrip || {};
        const { dispatch, getState } = store;
        const state = getState();

        if (stageFilmstripParticipants !== undefined) {
            dispatch(updateSettings({
                maxStageParticipants: stageFilmstripParticipants
            }));
        }

        if (initialWidth) {
            dispatch(setUserFilmstripWidth(initialWidth));
        }

        // FIXME On Web we rely on the global 'config' variable which gets altered
        // multiple times, before it makes it to the reducer. At some point it may
        // not be the global variable which is being modified anymore due to
        // different merge methods being used along the way. The global variable
        // must be synchronized with the final state resolved by the reducer.
        if (typeof window.config !== 'undefined') {
            window.config = state['features/base/config'];
        }

        break;
    }
    }

    return result;
});
