import { IStore } from '../app/types';
import { CONFERENCE_FAILED, CONFERENCE_LEFT } from '../base/conference/actionTypes';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';

import { REMOVE_SECOND_SCREEN, RESET_SECOND_SCREENS, SET_SECOND_SCREEN } from './actionTypes';
import { resetSecondScreens } from './actions.web';
import { closeAllSecondScreens, closeSecondScreen, openOrUpdateSecondScreen } from './functions.web';
import logger from './logger';

import './subscriber.web';

/**
 * Middleware that reconciles the live second-screen windows with the requested
 * state, and tears them all down when the conference ends.
 *
 * @param {IStore} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register((store: IStore) => next => action => {
    switch (action.type) {
    case SET_SECOND_SCREEN: {
        const result = next(action);

        openOrUpdateSecondScreen(store, action.id, action.screenId)
            .catch(e => logger.error('Failed to open second screen', e));

        return result;
    }
    case REMOVE_SECOND_SCREEN: {
        const result = next(action);

        closeSecondScreen(action.id);

        return result;
    }
    case RESET_SECOND_SCREENS: {
        const result = next(action);

        closeAllSecondScreens();

        return result;
    }
    case CONFERENCE_FAILED:
    case CONFERENCE_LEFT:

        // Resetting closes every second-screen window (via the RESET_SECOND_SCREENS
        // case above), so there is no need to close them explicitly here.
        store.dispatch(resetSecondScreens());
        break;
    }

    return next(action);
});
