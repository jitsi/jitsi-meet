/* eslint-disable lines-around-comment */
import LoginDialog from '../../authentication/components/web/LoginDialog';
import WaitForOwnerDialog from '../../authentication/components/web/WaitForOwnerDialog';
import ChatPrivacyDialog from '../../chat/components/web/ChatPrivacyDialog';
import DesktopPicker from '../../desktop-picker/components/DesktopPicker';
import DisplayNamePrompt from '../../display-name/components/web/DisplayNamePrompt';
import ParticipantVerificationDialog from '../../e2ee/components/ParticipantVerificationDialog';
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
// @ts-ignore
import RemoteControlAuthorizationDialog from '../../remote-control/components/RemoteControlAuthorizationDialog';
import SalesforceLinkDialog from '../../salesforce/components/web/SalesforceLinkDialog';
import ShareAudioDialog from '../../screen-share/components/web/ShareAudioDialog';
import ShareScreenWarningDialog from '../../screen-share/components/web/ShareScreenWarningDialog';
import SecurityDialog from '../../security/components/security-dialog/web/SecurityDialog';
import LogoutDialog from '../../settings/components/web/LogoutDialog';
import SharedVideoDialog from '../../shared-video/components/web/SharedVideoDialog';
import SpeakerStats from '../../speaker-stats/components/web/SpeakerStats';
import LanguageSelectorDialog from '../../subtitles/components/LanguageSelectorDialog.web';
import GrantModeratorDialog from '../../video-menu/components/web/GrantModeratorDialog';
import KickRemoteParticipantDialog from '../../video-menu/components/web/KickRemoteParticipantDialog';
import MuteEveryoneDialog from '../../video-menu/components/web/MuteEveryoneDialog';
import MuteEveryonesVideoDialog from '../../video-menu/components/web/MuteEveryonesVideoDialog';
import MuteRemoteParticipantsVideoDialog from '../../video-menu/components/web/MuteRemoteParticipantsVideoDialog';
// @ts-ignore
import VideoQualityDialog from '../../video-quality/components/VideoQualityDialog.web';
import VirtualBackgroundDialog from '../../virtual-background/components/VirtualBackgroundDialog';
import MiddlewareRegistry from '../redux/MiddlewareRegistry';

import { OPEN_DIALOG } from './actionTypes';

// ! IMPORTANT - This whole middleware is only needed for the transition from from @atlaskit dialog to our component.
// ! It should be removed when the transition is over.

const NEW_DIALOG_LIST = [ KeyboardShortcutsDialog, ChatPrivacyDialog, DisplayNamePrompt, EmbedMeetingDialog,
    FeedbackDialog, AddPeopleDialog, PremiumFeatureDialog, StartLiveStreamDialog, StopLiveStreamDialog,
    StartRecordingDialog, StopRecordingDialog, ShareAudioDialog, ShareScreenWarningDialog, SecurityDialog,
    SharedVideoDialog, SpeakerStats, LanguageSelectorDialog, MuteEveryoneDialog, MuteEveryonesVideoDialog,
    GrantModeratorDialog, KickRemoteParticipantDialog, MuteRemoteParticipantsVideoDialog, VideoQualityDialog,
    VirtualBackgroundDialog, LoginDialog, WaitForOwnerDialog, DesktopPicker, RemoteControlAuthorizationDialog,
    LogoutDialog, SalesforceLinkDialog, ParticipantVerificationDialog ];

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
