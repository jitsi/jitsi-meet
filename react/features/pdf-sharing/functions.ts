import { IReduxState } from '../app/types';
import { getCurrentConference } from '../base/conference/functions';
import { getLocalParticipant } from '../base/participants/functions';

import { PDF_ENDPOINT_MESSAGE_TYPE, PDF_PRESENTATION_COMMAND } from './constants';
import { IPdfPointer, IPdfSharingState } from './reducer';

/**
 * Returns the PDF sharing state from Redux.
 */
export function getPdfSharingState(state: IReduxState): IPdfSharingState {
    return state['features/pdf-sharing'];
}

/**
 * Checks whether PDF presentation sharing feature is enabled in config.
 */
export function isPdfSharingEnabled(state: IReduxState): boolean {
    const { pdfSharing } = state['features/base/config'] ?? {};

    return Boolean(pdfSharing?.enabled);
}

/**
 * Checks whether a PDF presentation is currently open.
 */
export function isPdfPresentationOpen(state: IReduxState): boolean {
    return Boolean(state['features/pdf-sharing']?.isOpen && state['features/pdf-sharing']?.pdfUrl);
}

/**
 * Checks whether the local participant is the presenter/owner of the current PDF presentation.
 */
export function isLocalUserPdfPresenter(state: IReduxState): boolean {
    const localId = getLocalParticipant(state)?.id;
    const ownerId = state['features/pdf-sharing']?.ownerId;

    return Boolean(localId && ownerId && localId === ownerId);
}

/**
 * Checks if the PDF sharing toolbar button should be visible.
 */
export function isPdfSharingButtonVisible(state: IReduxState): boolean {
    return isPdfSharingEnabled(state);
}

/**
 * Sends a PDF presentation command to all conference participants.
 */
export function sendPdfPresentationCommand(
        conference: any,
        status: string,
        pdfUrl?: string,
        pdfTitle?: string,
        totalPages?: number
) {
    if (!conference) {
        return;
    }

    conference.sendCommandOnce(PDF_PRESENTATION_COMMAND, {
        attributes: {
            status,
            pdfTitle: pdfTitle || '',
            totalPages: totalPages ? String(totalPages) : '0'
        },
        value: pdfUrl || ''
    });
}

/**
 * Sends a real-time endpoint message (for page synchronization or pointer movement).
 */
export function sendPdfEndpointMessage(
        conference: any,
        event: {
            type: 'page-change' | 'pointer';
            pageNumber?: number;
            pointer?: IPdfPointer;
        }
) {
    if (!conference?.sendEndpointMessage) {
        return;
    }

    try {
        conference.sendEndpointMessage('', {
            name: PDF_ENDPOINT_MESSAGE_TYPE,
            ...event
        });
    } catch (e) {
        // Ignored if sending fails
    }
}
