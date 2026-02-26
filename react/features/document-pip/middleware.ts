import { CONFERENCE_LEFT } from "../base/conference/actionTypes";
import MiddlewareRegistry from "../base/redux/MiddlewareRegistry";

import { closeDocumentPiP } from "./actions";
import logger from "./logger";

import "./reducer";

/**
 * Middleware that listens for conference lifecycle events
 * and closes the Document PiP window when the user leaves.
 */
MiddlewareRegistry.register((store) => (next) => (action) => {
    const result = next(action);

    switch (action.type) {
        case CONFERENCE_LEFT: {
            const { isActive } = store.getState()["features/document-pip"] || {};

            if (isActive) {
                logger.info("Conference left — closing Document PiP");
                store.dispatch(closeDocumentPiP());
            }
            break;
        }
    }

    return result;
});
