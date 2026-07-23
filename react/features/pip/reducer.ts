import ReducerRegistry from '../base/redux/ReducerRegistry';

import {
    SET_EMBEDDED_DOCUMENT_PIP_CAPABILITY,
    SET_EMBEDDED_DOCUMENT_PIP_LIFECYCLE,
    SET_EMBEDDED_DOCUMENT_PIP_RENDERER_READY,
    SET_PIP_ACTIVE
} from './actionTypes';
import { EmbeddedDocumentPiPCapability, EmbeddedDocumentPiPLifecycle } from './types';

/**
 * Document PiP layout types.
 */
export type DocPiPLayout = 'compact';

/**
 * The default state for the pip feature.
 */
const DEFAULT_STATE = {
    embeddedDocumentPiPCapability: EmbeddedDocumentPiPCapability.UNKNOWN,
    embeddedDocumentPiPLifecycle: EmbeddedDocumentPiPLifecycle.UNAVAILABLE,
    embeddedDocumentPiPRendererReady: false,
    isPiPActive: false
};

export interface IPipState {
    embeddedDocumentPiPCapability: EmbeddedDocumentPiPCapability;
    embeddedDocumentPiPLifecycle: EmbeddedDocumentPiPLifecycle;
    embeddedDocumentPiPRendererReady: boolean;
    isPiPActive: boolean;
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

    default:
        return state;
    }
});
