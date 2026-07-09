import { IStore } from '../app/types';
import { CONFERENCE_FAILED, CONFERENCE_LEFT } from '../base/conference/actionTypes';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';

import { REMOVE_SECOND_SCREEN, RESET_SECOND_SCREENS, SET_SECOND_SCREEN } from './actionTypes';
import { resetSecondScreens } from './actions.web';
import { closeAllSecondScreens, closeSecondScreenHandle, getHandle, openOrUpdateSecondScreen } from './functions.web';
import logger from './logger';

import './subscriber.web';

/**
 * Middleware that reconciles the live second-screen windows with the requested
 * state, tears them all down when the conference ends, and closes any that are
 * still open when the main window itself goes away.
 *
 * @param {IStore} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register((store: IStore) => {

    // Close every second-screen window when the main window goes away (tab closed,
    // reloaded, or navigated away). The CONFERENCE_LEFT/FAILED path below only
    // covers leaving the meeting from within the app; closing the main window
    // directly dispatches neither, so without this the popups are orphaned on the
    // second display. Closing from an unloading opener is best-effort. Skip
    // event.persisted (bfcache eviction): the page may be restored via pageshow
    // with the second screens still expected, so only tear down on a real unload.
    window.addEventListener('pagehide', (event: PageTransitionEvent) => {
        if (!event.persisted) {
            closeAllSecondScreens(store);
        }
    });

    return next => action => {
        switch (action.type) {
        case SET_SECOND_SCREEN: {
            const result = next(action);

            openOrUpdateSecondScreen(store, action.id, action.screenId)
                .catch(e => logger.error('Failed to open second screen', e));

            return result;
        }
        case REMOVE_SECOND_SCREEN: {

            // Capture the handle, then remove the entry first so the portal unmounts
            // (stopping its cloned track) while the window is still open; only then
            // close the window.
            const handle = getHandle(store.getState(), action.id);
            const result = next(action);

            closeSecondScreenHandle(handle, action.id);

            return result;
        }
        case RESET_SECOND_SCREENS:

            // Same ordering: close the windows while their entries are still in state.
            closeAllSecondScreens(store);

            return next(action);
        case CONFERENCE_FAILED:
        case CONFERENCE_LEFT:

            // Resetting closes every second-screen window (via the RESET_SECOND_SCREENS
            // case above), so there is no need to close them explicitly here.
            store.dispatch(resetSecondScreens());
            break;
        }

        return next(action);
    };
});
