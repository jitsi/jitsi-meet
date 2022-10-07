/* eslint-disable lines-around-comment */
import ChatPrivacyDialog from '../../chat/components/web/ChatPrivacyDialog';
import DisplayNamePrompt from '../../display-name/components/web/DisplayNamePrompt';
import EmbedMeetingDialog from '../../embed-meeting/components/EmbedMeetingDialog';
// @ts-ignore
import FeedbackDialog from '../../feedback/components/FeedbackDialog.web';
import AddPeopleDialog from '../../invite/components/add-people-dialog/web/AddPeopleDialog';
import PremiumFeatureDialog from '../../jaas/components/web/PremiumFeatureDialog';
import KeyboardShortcutsDialog from '../../keyboard-shortcuts/components/web/KeyboardShortcutsDialog';
// @ts-ignore
import StartLiveStreamDialog from '../../recording/components/LiveStream/web/StartLiveStreamDialog';
// @ts-ignore
import StopLiveStreamDialog from '../../recording/components/LiveStream/web/StopLiveStreamDialog';
// @ts-ignore
import StartRecordingDialog from '../../recording/components/Recording/web/StartRecordingDialog';
// @ts-ignore
import StopRecordingDialog from '../../recording/components/Recording/web/StopRecordingDialog';
import ShareAudioDialog from '../../screen-share/components/ShareAudioDialog';
import MiddlewareRegistry from '../redux/MiddlewareRegistry';

import { OPEN_DIALOG } from './actionTypes';

// ! IMPORTANT - This whole middleware is only needed for the transition from from @atlaskit dialog to our component.
// ! It should be removed when the transition is over.

const NEW_DIALOG_LIST = [ KeyboardShortcutsDialog, ChatPrivacyDialog, DisplayNamePrompt, EmbedMeetingDialog,
    FeedbackDialog, AddPeopleDialog, PremiumFeatureDialog, StartLiveStreamDialog, StopLiveStreamDialog,
    StartRecordingDialog, StopRecordingDialog, ShareAudioDialog ];

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
