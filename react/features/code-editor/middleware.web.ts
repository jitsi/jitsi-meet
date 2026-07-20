import { AnyAction } from 'redux';

import { IStore } from '../app/types';
import { UPDATE_CONFERENCE_METADATA } from '../base/conference/actionTypes';
import { getCurrentConference } from '../base/conference/functions';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';

import { SET_CODE_EDITOR_OPEN } from './actionTypes';
import { setCodeEditorOpen } from './actions.web';
import { CODE_EDITOR_METADATA_ID } from './constants';
import { isCodeEditorEnabled, isCodeEditorOpen } from './functions';

/**
 * Middleware that keeps the code editor's open-state in sync across
 * participants via conference metadata — the same channel the whiteboard uses.
 * A local toggle writes the metadata; every peer receives
 * {@code UPDATE_CONFERENCE_METADATA} and opens/closes to match.
 */
MiddlewareRegistry.register((store: IStore) => (next: Function) => (action: AnyAction) => {
    const { dispatch, getState } = store;

    switch (action.type) {
    case SET_CODE_EDITOR_OPEN: {
        const result = next(action);

        // Only a local click broadcasts; applying a remote change must not echo.
        if (action.userInitiated) {
            const conference = getCurrentConference(getState());

            conference?.getMetadataHandler().setMetadata(CODE_EDITOR_METADATA_ID, {
                open: Boolean(action.isOpen)
            });
        }

        return result;
    }
    case UPDATE_CONFERENCE_METADATA: {
        const state = getState();

        if (isCodeEditorEnabled(state)) {
            const open = Boolean(action.metadata?.[CODE_EDITOR_METADATA_ID]?.open);

            if (open !== isCodeEditorOpen(state)) {
                dispatch(setCodeEditorOpen(open, false));
            }
        }
        break;
    }
    }

    return next(action);
});
