// @ts-ignore
import VideoLayout from '../../../modules/UI/videolayout/VideoLayout';
import StateListenerRegistry from '../base/redux/StateListenerRegistry';
import { clientResized } from '../base/responsive-ui/actions';

import { setCustomPanelWidth } from './actions.web';
import { DEFAULT_CUSTOM_PANEL_WIDTH } from './constants';
import { getCustomPanelMaxSize } from './functions';

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
 * Listens for changes in the client width and custom panel width
 * to determine when to adjust the panel size for responsive behavior.
 */
StateListenerRegistry.register(
    /* selector */ state => {
        return {
            clientWidth: state['features/base/responsive-ui']?.clientWidth,
            isOpen: state['features/custom-panel'].isOpen,
            width: state['features/custom-panel'].width,
            maxWidth: getCustomPanelMaxSize(state)
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
            let panelWidthChanged = false;

            if (currentState.clientWidth !== previousState.clientWidth) {
                if (userSet !== null) {
                    // If userSet is set, clamp it within the new bounds.
                    // This handles the case when the screen gets smaller and
                    // the user-set width exceeds the max, or when the screen
                    // gets bigger and we can restore the user-set width.
                    dispatch(setCustomPanelWidth(
                        Math.max(Math.min(maxWidth, userSet), DEFAULT_CUSTOM_PANEL_WIDTH)
                    ));
                    panelWidthChanged = true;
                }
                // else { // when userSet is null:
                // no-op. The custom panel width will be the default one which is the min too.
                // }
            } else {
                // Width changed (not clientWidth) — panel was resized by user.
                panelWidthChanged = true;
            }

            if (panelWidthChanged) {
                const { innerWidth, innerHeight } = window;

                // Recalculate videoSpaceWidth since it depends on the custom panel width.
                dispatch(clientResized(innerWidth, innerHeight));

                // Recompute the large video size.
                VideoLayout.onResize();
            }
        }
    });
