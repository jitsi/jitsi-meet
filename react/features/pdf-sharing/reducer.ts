import ReducerRegistry from '../base/redux/ReducerRegistry';

import {
    RESET_PDF_PRESENTATION,
    SET_PDF_FOLLOWING_PRESENTER,
    SET_PDF_LOCAL_PAGE,
    SET_PDF_LOCAL_SCALE,
    SET_PDF_POINTER_COORDINATES,
    SET_PDF_PRESENTATION_STATUS,
    SET_PDF_PRESENTER_PAGE
} from './actionTypes';

export interface IPdfPointer {
    x: number; // normalized coordinate 0..1
    y: number; // normalized coordinate 0..1
    pageNumber: number;
    timestamp: number;
}

export interface IPdfSharingState {
    pdfUrl?: string;
    pdfTitle?: string;
    ownerId?: string;
    isOpen: boolean;
    presenterPage: number;
    localPage: number;
    totalPages: number;
    isFollowingPresenter: boolean;
    pointer?: IPdfPointer;
    scale: number;
}

const DEFAULT_STATE: IPdfSharingState = {
    pdfUrl: undefined,
    pdfTitle: undefined,
    ownerId: undefined,
    isOpen: false,
    presenterPage: 1,
    localPage: 1,
    totalPages: 0,
    isFollowingPresenter: true,
    pointer: undefined,
    scale: 1.0
};

ReducerRegistry.register<IPdfSharingState>(
    'features/pdf-sharing',
    (state = DEFAULT_STATE, action): IPdfSharingState => {
        switch (action.type) {
        case SET_PDF_PRESENTATION_STATUS: {
            const { pdfUrl, pdfTitle, ownerId, isOpen, totalPages } = action;

            return {
                ...state,
                pdfUrl,
                pdfTitle,
                ownerId,
                isOpen,
                totalPages: typeof totalPages === 'number' ? totalPages : state.totalPages,
                // reset follow state when opening a new presentation
                isFollowingPresenter: true,
                presenterPage: 1,
                localPage: 1,
                pointer: undefined
            };
        }

        case RESET_PDF_PRESENTATION:
            return DEFAULT_STATE;

        case SET_PDF_PRESENTER_PAGE: {
            const { pageNumber } = action;
            const newState: IPdfSharingState = {
                ...state,
                presenterPage: pageNumber
            };

            if (state.isFollowingPresenter) {
                newState.localPage = pageNumber;
            }

            return newState;
        }

        case SET_PDF_LOCAL_PAGE:
            return {
                ...state,
                localPage: action.pageNumber,
                isFollowingPresenter: action.pageNumber === state.presenterPage ? state.isFollowingPresenter : false
            };

        case SET_PDF_FOLLOWING_PRESENTER:
            return {
                ...state,
                isFollowingPresenter: action.isFollowing,
                localPage: action.isFollowing ? state.presenterPage : state.localPage
            };

        case SET_PDF_POINTER_COORDINATES:
            return {
                ...state,
                pointer: action.pointer
            };

        case SET_PDF_LOCAL_SCALE:
            return {
                ...state,
                scale: action.scale
            };

        default:
            return state;
        }
    }
);
