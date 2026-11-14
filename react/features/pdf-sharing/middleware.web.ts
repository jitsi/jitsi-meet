import { IStore } from '../app/types';
import { CONFERENCE_JOIN_IN_PROGRESS } from '../base/conference/actionTypes';
import { getCurrentConference } from '../base/conference/functions';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import StateListenerRegistry from '../base/redux/StateListenerRegistry';

import {
    resetPdfPresentation,
    setPdfPresentationStatus,
    setPointerCoordinates,
    setPresenterPage
} from './actions';
import {
    PDF_ENDPOINT_MESSAGE_TYPE,
    PDF_PRESENTATION_COMMAND,
    PDF_PRESENTATION_STATUSES
} from './constants';
import { isPdfSharingEnabled } from './functions';
import logger from './logger';

MiddlewareRegistry.register(store => next => action => {
    const { dispatch, getState } = store;

    if (!isPdfSharingEnabled(getState())) {
        return next(action);
    }

    switch (action.type) {
    case CONFERENCE_JOIN_IN_PROGRESS: {
        const { conference } = action;

        // Listen for XMPP presence commands (PDF start/stop)
        conference.addCommandListener(PDF_PRESENTATION_COMMAND,
            ({ value, attributes }: {
                attributes: { pdfTitle?: string; status: string; totalPages?: string; };
                value: string;
            }, from: string) => {
                const status = attributes?.status;

                logger.info(`Received PDF presentation command from ${from}: ${status}, url: ${value}`);

                if (status === PDF_PRESENTATION_STATUSES.STOP) {
                    dispatch(resetPdfPresentation());
                } else if (status === PDF_PRESENTATION_STATUSES.START && value) {
                    const totalPages = attributes.totalPages ? parseInt(attributes.totalPages, 10) : 0;

                    dispatch(setPdfPresentationStatus({
                        pdfUrl: value,
                        pdfTitle: attributes.pdfTitle,
                        ownerId: from,
                        isOpen: true,
                        totalPages
                    }));
                }
            }
        );

        // Listen for endpoint messages (real-time page changes and pointer events)
        conference.on('conference.endpoint_message_received', (participant: any, data: any) => {
            if (data?.name !== PDF_ENDPOINT_MESSAGE_TYPE) {
                return;
            }

            const state = getState();
            const { ownerId } = state['features/pdf-sharing'];

            // Only process events originating from the current presenter
            if (ownerId && participant?.getId?.() !== ownerId) {
                return;
            }

            if (data.type === 'page-change' && typeof data.pageNumber === 'number') {
                dispatch(setPresenterPage(data.pageNumber));
            } else if (data.type === 'pointer') {
                dispatch(setPointerCoordinates(data.pointer));
            }
        });

        break;
    }
    }

    return next(action);
});

/**
 * State listener to clean up PDF presentation if the conference is left.
 */
StateListenerRegistry.register(
    state => getCurrentConference(state),
    (conference, { dispatch }, previousConference) => {
        if (previousConference && !conference) {
            dispatch(resetPdfPresentation());
        }
    }
);
