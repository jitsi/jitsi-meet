import { IReduxState, IStore } from '../app/types';
import StateListenerRegistry from '../base/redux/StateListenerRegistry';

import { isAudioMuteButtonDisabled } from './functions.any';

declare let APP: any;

/**
 * Notifies when audio availability changes.
 */
StateListenerRegistry.register(
    /* selector */ (state: IReduxState) => isAudioMuteButtonDisabled(state),
    /* listener */ (disabled: boolean, store: IStore, previousDisabled: boolean) => {
        if (typeof APP !== 'object') {
            return;
        }

        if (disabled !== previousDisabled) {
            APP.API.notifyAudioAvailabilityChanged(!disabled);
        }
    }
);
