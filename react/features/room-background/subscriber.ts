import StateListenerRegistry from '../base/redux/StateListenerRegistry';

import { updateBackgroundData } from './actions';
import { extractBackgroundProperties } from './functions';

// import { extractBackgroundProperties } from './functions';

// declare var APP: Object;

/**
 * Updates the room background when participants backgroundData property is updated.
 */
StateListenerRegistry.register(
    /* selector */ state => state['features/base/participants'],
    /* listener */(state, { dispatch }) => {


        // if (!state.length) {
        //     return;
        // }

        // const localParticipant = getLocalParticipant(state);
        const backgroundData = state.local?.backgroundData;


        // if (backgroundData === previousState.local?.backgroundData) {
        //     return;
        // }


        // Updating the background of the room
        dispatch(updateBackgroundData(backgroundData));

        // Sending an event to the client to communicate the background change
        if (typeof APP !== 'undefined') {
            const backgroundProperties = extractBackgroundProperties(backgroundData);

            APP.API.notifyBackgroundChanged(
            state.local.id,
            {
                backgroundImageUrl: backgroundProperties.backgroundImageUrl,
                backgroundColor: backgroundProperties.backgroundColor
            });
        }
    }
);

/**
 * When the background of the room is updated, resize the video.
 */
// StateListenerRegistry.register(
//     /* selector */ state => state['features/room-background'],
//     /* listener */(state, { dispatch }) => {
//         dispatch(refreshResizingLargeVideo(true));
//     }
// );
