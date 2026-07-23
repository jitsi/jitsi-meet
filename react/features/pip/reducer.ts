import ReducerRegistry from '../base/redux/ReducerRegistry';

import { SET_PIP_ACTIVE, SET_PIP_WINDOW } from './actionTypes';

/**
 * The default state for the pip feature.
 */
const DEFAULT_STATE = {
    isPiPActive: false,
    pipWindow: null
};

export interface IPipState {
    embeddedDocumentPiPCapability: EmbeddedDocumentPiPCapability;
    embeddedDocumentPiPLifecycle: EmbeddedDocumentPiPLifecycle;
    embeddedDocumentPiPRendererReady: boolean;
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
}

/**
 * Reduces the Redux actions of the pip feature.
 */
ReducerRegistry.register<IPipState>('features/pip', (state = DEFAULT_STATE, action): IPipState => {
    switch (action.type) {
    case SET_EMBEDDED_DOCUMENT_PIP_CAPABILITY:
        if (action.capability !== EmbeddedDocumentPiPCapability.AVAILABLE) {
            return {
                ...state,
                embeddedDocumentPiPCapability: action.capability,
                embeddedDocumentPiPLifecycle: EmbeddedDocumentPiPLifecycle.UNAVAILABLE,
                embeddedDocumentPiPRendererReady: false,
                isPiPActive: false
            };
        }

        return {
            ...state,
            embeddedDocumentPiPCapability: action.capability,
            embeddedDocumentPiPLifecycle: state.embeddedDocumentPiPLifecycle === EmbeddedDocumentPiPLifecycle.UNAVAILABLE
                ? EmbeddedDocumentPiPLifecycle.IDLE
                : state.embeddedDocumentPiPLifecycle
        };
    case SET_EMBEDDED_DOCUMENT_PIP_LIFECYCLE:
        if (state.embeddedDocumentPiPCapability !== EmbeddedDocumentPiPCapability.AVAILABLE) {
            return {
                ...state,
                embeddedDocumentPiPLifecycle: EmbeddedDocumentPiPLifecycle.UNAVAILABLE,
                embeddedDocumentPiPRendererReady: false,
                isPiPActive: false
            };
        }

        return {
            ...state,
            embeddedDocumentPiPLifecycle: action.lifecycle,
            embeddedDocumentPiPRendererReady: action.lifecycle === EmbeddedDocumentPiPLifecycle.ACTIVE
                ? state.embeddedDocumentPiPRendererReady
                : false,
            isPiPActive: action.lifecycle === EmbeddedDocumentPiPLifecycle.ACTIVE
        };
    case SET_EMBEDDED_DOCUMENT_PIP_RENDERER_READY:
        if (!action.ready) {
            return {
                ...state,
                embeddedDocumentPiPRendererReady: false
            };
        }

        if (state.embeddedDocumentPiPCapability !== EmbeddedDocumentPiPCapability.AVAILABLE
                || state.embeddedDocumentPiPLifecycle !== EmbeddedDocumentPiPLifecycle.ACTIVE) {
            return state;
        }

        return {
            ...state,
            embeddedDocumentPiPRendererReady: true
        };
    case SET_PIP_ACTIVE:
        return {
            ...state,
            isPiPActive: action.isPiPActive
        };

    case SET_PIP_WINDOW:
        return {
            ...state,
            pipWindow: action.pipWindow
        };

    default:
        return state;
    }
});
