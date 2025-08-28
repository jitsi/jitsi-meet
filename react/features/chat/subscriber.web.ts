// @ts-ignore
import VideoLayout from '../../../modules/UI/videolayout/VideoLayout';
import StateListenerRegistry from '../base/redux/StateListenerRegistry';
import { clientResized } from '../base/responsive-ui/actions';

import { setChatWidth } from './actions.web';
import { CHAT_SIZE } from './constants';
import { getChatMaxSize } from './functions';


// import { setChatWidth } from './actions.web';

interface IListenerState {
    clientWidth: number;
    isOpen: boolean;
    maxWidth: number;
    width: {
        current: number;
        userSet: number | null;
    };
}

/**
 * Listens for changes in the client width to determine when to resize the chat panel.
 */
StateListenerRegistry.register(
    /* selector */ state => {
        return {
            clientWidth: state['features/base/responsive-ui']?.clientWidth,
            isOpen: state['features/chat'].isOpen,
            width: state['features/chat'].width,
            maxWidth: getChatMaxSize(state)
        };
    },
    /* listener */ (
            currentState: IListenerState,
            { dispatch },
            previousState: IListenerState
    ) => {
        if (currentState.isOpen
            && (currentState.clientWidth !== previousState.clientWidth
                || currentState.width !== previousState.width)) {
            const { userSet = 0 } = currentState.width;
            const { maxWidth } = currentState;
            let chatPanelWidthChanged = false;

            if (currentState.clientWidth !== previousState.clientWidth) {
                if (userSet !== null) {
                    // if userSet is set, we need to check if it is within the bounds and potentially adjust it.
                    // This is in the case when screen gets smaller and the user set width is more than the maxWidth
                    // and we need to set it to the maxWidth. And also when the user set width has been larger than
                    // the maxWidth and we have reduced the current width to the maxWidth but now the screen gets bigger
                    // and we can increase the current width.
                    dispatch(setChatWidth(Math.max(Math.min(maxWidth, userSet), CHAT_SIZE)));
                    chatPanelWidthChanged = true;
                } // else { // when userSet is null:
                // no-op. The chat panel width will be the default one which is the min too.
                // }
            } else { // currentState.width !== previousState.width
                chatPanelWidthChanged = true;
            }

            if (chatPanelWidthChanged) {
                const { innerWidth, innerHeight } = window;

                // Since the videoSpaceWidth relies on the chat panel width, we need to adjust it when the chat panel size changes
                dispatch(clientResized(innerWidth, innerHeight));
            }

            // Recompute the large video size when chat is open and window resizes
            VideoLayout.onResize();
        }
    });
