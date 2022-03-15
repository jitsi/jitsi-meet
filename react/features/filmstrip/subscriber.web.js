// @flow

import { isMobileBrowser } from '../base/environment/utils';
import { getParticipantCountWithFake } from '../base/participants';
import { StateListenerRegistry } from '../base/redux';
import { clientResized } from '../base/responsive-ui';
import { shouldHideSelfView } from '../base/settings';
import { setFilmstripVisible } from '../filmstrip/actions';
import { getParticipantsPaneOpen } from '../participants-pane/functions';
import { setOverflowDrawer } from '../toolbox/actions.web';
import { getCurrentLayout, shouldDisplayTileView, LAYOUTS } from '../video-layout';

import {
    setHorizontalViewDimensions,
    setTileViewDimensions,
    setVerticalViewDimensions
} from './actions';
import {
    ASPECT_RATIO_BREAKPOINT,
    DISPLAY_DRAWER_THRESHOLD
} from './constants';
import { isFilmstripResizable, isFilmstripScollVisible, updateRemoteParticipants } from './functions';
import './subscriber.any';


/**
 * Listens for changes in the number of participants to calculate the dimensions of the tile view grid and the tiles.
 */
StateListenerRegistry.register(
    /* selector */ state => {
        return {
            numberOfParticipants: getParticipantCountWithFake(state),
            disableSelfView: shouldHideSelfView(state)
        };
    },
    /* listener */ (currentState, store) => {
        const state = store.getState();
        const resizableFilmstrip = isFilmstripResizable(state);

        if (shouldDisplayTileView(state)) {
            store.dispatch(setTileViewDimensions());
        }
        if (resizableFilmstrip) {
            store.dispatch(setVerticalViewDimensions());
        }
    }, {
        deepEquals: true
    });

/**
 * Listens for changes in the selected layout to calculate the dimensions of the tile view grid and horizontal view.
 */
StateListenerRegistry.register(
    /* selector */ state => getCurrentLayout(state),
    /* listener */ (layout, store) => {
        switch (layout) {
        case LAYOUTS.TILE_VIEW:
            store.dispatch(setTileViewDimensions());
            break;
        case LAYOUTS.HORIZONTAL_FILMSTRIP_VIEW:
            store.dispatch(setHorizontalViewDimensions());
            break;
        case LAYOUTS.VERTICAL_FILMSTRIP_VIEW:
            store.dispatch(setVerticalViewDimensions());
            break;
        }
    });

/**
 * Listens for changes in the chat state to recompute available width.
 */
StateListenerRegistry.register(
    /* selector */ state => state['features/chat'].isOpen,
    /* listener */ (isChatOpen, store) => {
        const { innerWidth, innerHeight } = window;

        if (isChatOpen) {
            // $FlowFixMe
            document.body.classList.add('shift-right');
        } else {
            // $FlowFixMe
            document.body.classList.remove('shift-right');
        }

        store.dispatch(clientResized(innerWidth, innerHeight));
    });

/**
 * Listens for changes in the participant pane state to calculate the
 * dimensions of the tile view grid and the tiles.
 */
StateListenerRegistry.register(
    /* selector */ getParticipantsPaneOpen,
    /* listener */ (isOpen, store) => {
        const { innerWidth, innerHeight } = window;

        store.dispatch(clientResized(innerWidth, innerHeight));
    });


/**
 * Listens for changes in the client width to determine whether the overflow menu(s) should be displayed as drawers.
 */
StateListenerRegistry.register(
    /* selector */ state => state['features/base/responsive-ui'].clientWidth < DISPLAY_DRAWER_THRESHOLD,
    /* listener */ (widthBelowThreshold, store) => {
        if (isMobileBrowser()) {
            store.dispatch(setOverflowDrawer(widthBelowThreshold));
        }
    });

/**
 * Gracefully hide/show the filmstrip when going past threshold.
 */
StateListenerRegistry.register(
    /* selector */ state => state['features/base/responsive-ui'].clientWidth < ASPECT_RATIO_BREAKPOINT,
    /* listener */ (widthBelowThreshold, store) => {
        const state = store.getState();
        const { disableFilmstripAutohiding } = state['features/base/config'];

        if (!disableFilmstripAutohiding) {
            store.dispatch(setFilmstripVisible(!widthBelowThreshold));
        }
    });

/**
 * Listens for changes in the filmstrip width to determine the size of the tiles.
 */
StateListenerRegistry.register(
    /* selector */ state => state['features/filmstrip'].width?.current,
    /* listener */(_, store) => {
        store.dispatch(setVerticalViewDimensions());
    });

/**
 * Listens for changes in the filmstrip config to determine the size of the tiles.
 */
StateListenerRegistry.register(
    /* selector */ state => state['features/base/config'].filmstrip?.disableResizable,
    /* listener */(_, store) => {
        store.dispatch(setVerticalViewDimensions());
    });

/**
 * Listens for changes in the filmstrip scroll visibility.
 */
StateListenerRegistry.register(
    /* selector */ state => isFilmstripScollVisible(state),
    /* listener */ (_, store) => updateRemoteParticipants(store));
