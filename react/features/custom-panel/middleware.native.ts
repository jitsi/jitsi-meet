import './middleware.any';
import StateListenerRegistry from '../base/redux/StateListenerRegistry';
import { isInBreakoutRoom } from '../breakout-rooms/functions';
import {
    conferenceNavigationRef,
    popTo
} from '../mobile/navigation/components/conference/ConferenceNavigationContainerRef';
import { screen } from '../mobile/navigation/routes';

/**
 * Closes the AI Assist screen on entering a breakout room, where there are no transcriptions.
 */
StateListenerRegistry.register(
    state => Boolean(isInBreakoutRoom(state)),
    (inBreakoutRoom: boolean) => {
        if (!inBreakoutRoom) {
            return;
        }

        if (conferenceNavigationRef.current?.getCurrentRoute()?.name === screen.conference.customPanel) {
            popTo(screen.conference.main);
        }
    }
);
