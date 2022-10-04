import ChatPrivacyDialog from '../../chat/components/web/ChatPrivacyDialog';
import DisplayNamePrompt from '../../display-name/components/web/DisplayNamePrompt';
import EmbedMeetingDialog from '../../embed-meeting/components/EmbedMeetingDialog';
import KeyboardShortcutsDialog from '../../keyboard-shortcuts/components/web/KeyboardShortcutsDialog';
import MiddlewareRegistry from '../redux/MiddlewareRegistry';

import { OPEN_DIALOG } from './actionTypes';

// ! IMPORTANT - This whole middleware is only needed for the transition from from @atlaskit dialog to our component.
// ! It should be removed when the transition is over.

const NEW_DIALOG_LIST = [ KeyboardShortcutsDialog, ChatPrivacyDialog, DisplayNamePrompt, EmbedMeetingDialog ];

// This function is necessary while the transition from @atlaskit dialog to our component is ongoing.
const isNewDialog = (component: any) => NEW_DIALOG_LIST.some(comp => comp === component);

/**
 * Implements the entry point of the middleware of the feature base/media.
 *
 * @param {IStore} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(() => (next: Function) => (action: any) => {
    switch (action.type) {
    case OPEN_DIALOG: {
        action.isNewDialog = isNewDialog(action.component);
    }
    }

    return next(action);
});
