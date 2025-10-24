import { getLocalParticipant } from '../base/participants/functions';
import StateListenerRegistry from '../base/redux/StateListenerRegistry';
import { appendSuffix } from '../display-name/functions';
import { shouldDisplayTileView } from '../video-layout/functions';

/**
 * StateListenerRegistry provides a reliable way of detecting changes to
 * preferred layout state and dispatching additional actions.
 */
StateListenerRegistry.register(
    /* selector */ state => shouldDisplayTileView(state),
    /* listener */ displayTileView => {
        APP.API.notifyTileViewChanged(displayTileView);
    });

StateListenerRegistry.register(
    /* selector */ state => state['features/base/settings'].displayName,
    /* listener */ (displayName, store) => {
        const localParticipant = getLocalParticipant(store.getState());
        const { defaultLocalDisplayName } = store.getState()['features/base/config'];

        // Initial setting of the display name happens on app
        // initialization, before the local participant is ready. The initial
        // settings is not desired to be fired anyways, only changes.
        if (localParticipant) {
            const { id } = localParticipant;

            APP.API.notifyDisplayNameChanged(id, {
                displayName,
                formattedDisplayName: appendSuffix(
                    displayName,
                    defaultLocalDisplayName
                )
            });
        }
    });

StateListenerRegistry.register(
    /* selector */ state => state['features/base/settings'].email,
    /* listener */ (email, store) => {
        const localParticipant = getLocalParticipant(store.getState());

        // Initial setting of the email happens on app
        // initialization, before the local participant is ready. The initial
        // settings is not desired to be fired anyways, only changes.
        if (localParticipant) {
            const { id } = localParticipant;

            APP.API.notifyEmailChanged(id, {
                email
            });
        }
    });

/**
 * Updates the on stage participant value.
 */
StateListenerRegistry.register(
    /* selector */ state => state['features/large-video'].participantId,
    /* listener */ participantId => {
        APP.API.notifyOnStageParticipantChanged(participantId);
    }
);

/**
 * Updates the on audio only value.
 */
StateListenerRegistry.register(
    /* selector */ state => state['features/base/audio-only'].enabled,
    /* listener */ enabled => {
        APP.API.notifyAudioOnlyChanged(enabled);
    }
);
