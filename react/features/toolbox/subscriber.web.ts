import { IReduxState, IStore } from '../app/types';
import StateListenerRegistry from '../base/redux/StateListenerRegistry';
import { clientResized } from '../base/responsive-ui/actions';

import { isAudioMuteButtonDisabled } from './functions.any';
import { isToolboxVisible } from './functions.web';

/**
 * Notifies when audio availability changes.
 */
StateListenerRegistry.register(
    /* selector */ (state: IReduxState) => isAudioMuteButtonDisabled(state),
    /* listener */ (disabled: boolean, store: IStore, previousDisabled: boolean) => {
        if (disabled !== previousDisabled) {
            APP.API.notifyAudioAvailabilityChanged(!disabled);
        }
    }
);

/**
 * Listens for changes in toolbox visibility to calculate the
 * dimensions of the tile view grid and the tiles.
 */
StateListenerRegistry.register(
    /* selector */ isToolboxVisible,
    /* listener */(isVisible, store) => {
        const { innerWidth, innerHeight } = window;

        store.dispatch(clientResized(innerWidth, innerHeight));
    });
