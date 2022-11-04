import { IReduxState, IStore } from '../../app/types';
import StateListenerRegistry from '../redux/StateListenerRegistry';

/**
 * Notifies when the local audio mute state changes.
 */
StateListenerRegistry.register(
    /* selector */ (state: IReduxState) => state['features/base/media'].audio.muted,
    /* listener */ (muted: boolean, store: IStore, previousMuted: boolean) => {
        if (typeof APP !== 'object') {
            return;
        }

        if (muted !== previousMuted) {
            APP.API.notifyAudioMutedStatusChanged(muted);
        }
    }
);
