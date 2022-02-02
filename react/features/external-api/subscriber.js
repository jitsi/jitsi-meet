// @flow

import { getLocalParticipant } from '../base/participants';
import { StateListenerRegistry } from '../base/redux';
import { appendSuffix } from '../display-name';
import { shouldDisplayTileView } from '../video-layout';

declare var APP: Object;

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

        // Initial setting of the display name occurs happens on app
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

/**
 * Updates the on stage participant value.
 */
StateListenerRegistry.register(
    /* selector */ state => state['features/large-video'].participantId,
    /* listener */ participantId => {
        APP.API.notifyOnStageParticipantChanged(participantId);
    }
);
