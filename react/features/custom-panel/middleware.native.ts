import StateListenerRegistry from '../base/redux/StateListenerRegistry';
import { isInBreakoutRoom } from '../breakout-rooms/functions';
import {
    conferenceNavigationRef,
    popTo
} from '../mobile/navigation/components/conference/ConferenceNavigationContainerRef';
import { screen } from '../mobile/navigation/routes';

/**
 * The advisor works from meeting transcriptions, which are not available in a breakout
 * room. Pop the Copilot screen when the local participant switches into one.
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
