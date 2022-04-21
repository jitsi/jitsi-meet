// @flow

import { isMobileBrowser } from '../base/environment/utils';
import { getParticipantCountWithFake, pinParticipant } from '../base/participants';
import { StateListenerRegistry } from '../base/redux';
import { clientResized } from '../base/responsive-ui';
import { shouldHideSelfView } from '../base/settings';
import { setFilmstripVisible } from '../filmstrip/actions';
import { selectParticipantInLargeVideo } from '../large-video/actions.any';
import { getParticipantsPaneOpen } from '../participants-pane/functions';
import { setOverflowDrawer } from '../toolbox/actions.web';
import { getCurrentLayout, shouldDisplayTileView, LAYOUTS } from '../video-layout';

import {
    clearStageParticipants,
    setHorizontalViewDimensions,
    setStageFilmstripViewDimensions,
    setTileViewDimensions,
    setVerticalViewDimensions
} from './actions';
import {
    ASPECT_RATIO_BREAKPOINT,
    DISPLAY_DRAWER_THRESHOLD
} from './constants';
import {
    isFilmstripResizable,
    isFilmstripScrollVisible,
    updateRemoteParticipants
} from './functions';

import './subscriber.any';


/**
 * Listens for changes in the number of participants to calculate the dimensions of the tile view grid and the tiles.
 */
StateListenerRegistry.register(
    /* selector */ state => {
        return {
            numberOfParticipants: getParticipantCountWithFake(state),
            disableSelfView: shouldHideSelfView(state),
            localScreenShare: state['features/base/participants'].localScreenShare
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
    /* selector */ state => {
        return { layout: getCurrentLayout(state),
            width: state['features/base/responsive-ui'].clientWidth };
    },
    /* listener */ ({ layout }, store) => {
        switch (layout) {
        case LAYOUTS.TILE_VIEW:
            store.dispatch(setTileViewDimensions());
            break;
        case LAYOUTS.HORIZONTAL_FILMSTRIP_VIEW:
            store.dispatch(setHorizontalViewDimensions());
            break;
        case LAYOUTS.VERTICAL_FILMSTRIP_VIEW:
            store.dispatch(setVerticalViewDimensions());
            if (store.getState()['features/filmstrip'].activeParticipants.length > 1) {
                store.dispatch(clearStageParticipants());
            }
            break;
        case LAYOUTS.STAGE_FILMSTRIP_VIEW:
            store.dispatch(pinParticipant(null));
            break;
        }
    }, {
        deepEquals: true
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
    /* selector */ state => isFilmstripScrollVisible(state),
    /* listener */ (_, store) => updateRemoteParticipants(store));

/**
 * Listens for changes to determine the size of the stage filmstrip tiles.
 */
StateListenerRegistry.register(
    /* selector */ state => {
        return {
            remoteScreenShares: state['features/video-layout'].remoteScreenShares.length,
            length: state['features/filmstrip'].activeParticipants.length,
            width: state['features/filmstrip'].width?.current,
            visible: state['features/filmstrip'].visible,
            clientWidth: state['features/base/responsive-ui'].clientWidth,
            tileView: state['features/video-layout'].tileViewEnabled
        };
    },
    /* listener */(_, store) => {
        if (getCurrentLayout(store.getState()) === LAYOUTS.STAGE_FILMSTRIP_VIEW) {
            store.dispatch(setStageFilmstripViewDimensions());
        }
    }, {
        deepEquals: true
    });

/**
 * Listens for changes in the active participants count determine the stage participant (when
 * there's just one).
 */
StateListenerRegistry.register(
    /* selector */ state => state['features/filmstrip'].activeParticipants.length,
    /* listener */(length, store) => {
        if (length <= 1) {
            store.dispatch(selectParticipantInLargeVideo());
        }
    });
