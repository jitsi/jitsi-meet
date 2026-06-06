import { IReduxState, IStore } from '../../app/types';
import { getLocalParticipant } from '../participants/functions';
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

            // Also fire the participantMuted event for consistency
            const localParticipant = getLocalParticipant(store.getState());

            if (localParticipant) {
                APP.API.notifyParticipantMuted(localParticipant.id, muted, 'audio');
            }
        }
    }
);
