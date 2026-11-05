import { IStore } from '../app/types';
import { getCurrentConference } from '../base/conference/functions';
import { getLocalParticipant } from '../base/participants/functions';

import {
    RESET_PDF_PRESENTATION,
    SET_PDF_FOLLOWING_PRESENTER,
    SET_PDF_LOCAL_PAGE,
    SET_PDF_LOCAL_SCALE,
    SET_PDF_POINTER_COORDINATES,
    SET_PDF_PRESENTATION_STATUS,
    SET_PDF_PRESENTER_PAGE
} from './actionTypes';
import { PDF_PRESENTATION_STATUSES } from './constants';
import { isLocalUserPdfPresenter, sendPdfEndpointMessage, sendPdfPresentationCommand } from './functions';
import { IPdfPointer } from './reducer';

/**
 * Sets the PDF presentation status.
 */
export function setPdfPresentationStatus({
    pdfUrl,
    pdfTitle,
    ownerId,
    isOpen,
    totalPages
}: {
    isOpen: boolean;
    ownerId?: string;
    pdfTitle?: string;
    pdfUrl?: string;
    totalPages?: number;
}) {
    return {
        type: SET_PDF_PRESENTATION_STATUS,
        pdfUrl,
        pdfTitle,
        ownerId,
        isOpen,
        totalPages
    };
}

/**
 * Stops/resets the PDF presentation.
 */
export function resetPdfPresentation() {
    return {
        type: RESET_PDF_PRESENTATION
    };
}

/**
 * Sets the presenter page number and broadcasts if local user is presenter.
 */
export function setPresenterPage(pageNumber: number) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();
        const conference = getCurrentConference(state);

        dispatch({
            type: SET_PDF_PRESENTER_PAGE,
            pageNumber
        });

        if (isLocalUserPdfPresenter(state)) {
            sendPdfEndpointMessage(conference, {
                type: 'page-change',
                pageNumber
            });
        }
    };
}

/**
 * Sets the local viewer page number (independent browsing).
 */
export function setLocalPage(pageNumber: number) {
    return {
        type: SET_PDF_LOCAL_PAGE,
        pageNumber
    };
}

/**
 * Sets whether the participant is actively following the presenter.
 */
export function setFollowingPresenter(isFollowing: boolean) {
    return {
        type: SET_PDF_FOLLOWING_PRESENTER,
        isFollowing
    };
}

/**
 * Updates presenter laser pointer and broadcasts if local user is presenter.
 */
export function setPointerCoordinates(pointer?: IPdfPointer) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();
        const conference = getCurrentConference(state);

        dispatch({
            type: SET_PDF_POINTER_COORDINATES,
            pointer
        });

        if (isLocalUserPdfPresenter(state) && pointer) {
            sendPdfEndpointMessage(conference, {
                type: 'pointer',
                pointer
            });
        }
    };
}

/**
 * Sets local zoom scale.
 */
export function setLocalScale(scale: number) {
    return {
        type: SET_PDF_LOCAL_SCALE,
        scale
    };
}

/**
 * Starts presenting a PDF file.
 */
export function startPdfPresentation(pdfUrl: string, pdfTitle?: string, totalPages?: number) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();
        const conference = getCurrentConference(state);
        const localId = getLocalParticipant(state)?.id;

        dispatch(setPdfPresentationStatus({
            pdfUrl,
            pdfTitle,
            ownerId: localId,
            isOpen: true,
            totalPages
        }));

        sendPdfPresentationCommand(
            conference,
            PDF_PRESENTATION_STATUSES.START,
            pdfUrl,
            pdfTitle,
            totalPages
        );
    };
}

/**
 * Stops presenting the current PDF file.
 */
export function stopPdfPresentation() {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();
        const conference = getCurrentConference(state);

        dispatch(resetPdfPresentation());

        sendPdfPresentationCommand(
            conference,
            PDF_PRESENTATION_STATUSES.STOP
        );
    };
}
