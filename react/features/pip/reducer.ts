import ReducerRegistry from '../base/redux/ReducerRegistry';

import {
    SET_PIP_ACTIVE,
    SET_PIP_DISMISSED,
    SET_PIP_WINDOW,
    SET_PIP_WINDOW_MODE_UNSUPPORTED
} from './actionTypes';

/**
 * The default state for the pip feature.
 */
const DEFAULT_STATE = {
    dismissed: false,
    isPiPActive: false,
    pipWindow: null,
    windowModeUnsupported: false
};

export interface IPipState {
    /**
     * Whether the user dismissed PiP (closed the custom Electron PiP window
     * with its X button or through the OS) for the rest of the conference.
     */
    dismissed: boolean;

    isPiPActive: boolean;

    /**
     * The Document PiP window this feature opened and initialized (stylesheets copied, #pip-root
     * container created), or null when none is open. This differs from
     * window.documentPictureInPicture.window, which is the browser's view of any Document PiP
     * window open for the page regardless of who opened it. Kept in Redux so that every change
     * to the reference is observable by React.
     *
     * The ts-ignore mirrors web-hid's HIDDevice: the pip feature is excluded from the native
     * TypeScript config, which has no DOM lib defining Window, but this interface still reaches
     * the native check through IReduxState. Types are erased at build time, so the suppression
     * only affects the type check and nothing on native ever reads this field.
     */
    // @ts-ignore
    pipWindow: Window | null;

    /**
     * Whether the embedding Electron app was detected to not support the
     * custom PiP window (the popup was denied by its main process), in which
     * case the video-element PiP is used for the rest of the session.
     */
    windowModeUnsupported: boolean;
}

/**
 * Reduces the Redux actions of the pip feature.
 */
ReducerRegistry.register<IPipState>('features/pip', (state = DEFAULT_STATE, action): IPipState => {
    switch (action.type) {
    case SET_PIP_ACTIVE:
        return {
            ...state,
            isPiPActive: action.isPiPActive
        };

    case SET_PIP_DISMISSED:
        return {
            ...state,
            dismissed: action.dismissed
        };

    case SET_PIP_WINDOW:
        return {
            ...state,
            pipWindow: action.pipWindow
        };

    case SET_PIP_WINDOW_MODE_UNSUPPORTED:
        return {
            ...state,
            windowModeUnsupported: action.unsupported
        };

    default:
        return state;
    }
});
