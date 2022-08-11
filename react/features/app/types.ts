import { IAnalyticsState } from '../analytics/reducer';
import { IAuthenticationState } from '../authentication/reducer';
import { IAVModerationState } from '../av-moderation/reducer';
import { IAppState } from '../base/app/reducer';
import { IAudioOnlyState } from '../base/audio-only/reducer';
import { IConferenceState } from '../base/conference/reducer';
import { IConfig } from '../base/config/configType';
import { IConnectionState } from '../base/connection/reducer';
import { IDevicesState } from '../base/devices/reducer';
import { IDialogState } from '../base/dialog/reducer';
import { IFlagsState } from '../base/flags/reducer';
import { IJwtState } from '../base/jwt/reducer';
import { ILastNState } from '../base/lastn/reducer';
import { ILibJitsiMeetState } from '../base/lib-jitsi-meet/reducer';
import { ILoggingState } from '../base/logging/reducer';
import { IMediaState } from '../base/media/reducer';
import { INetInfoState } from '../base/net-info/reducer';
import { IParticipantsState } from '../base/participants/reducer';
import { IResponsiveUIState } from '../base/responsive-ui/reducer';
import { ISettingsState } from '../base/settings/reducer';
import { ISoundsState } from '../base/sounds/reducer';
import { ITestingState } from '../base/testing/reducer';
import { INoSrcDataState, ITracksState } from '../base/tracks/reducer';
import { IUserInteractionState } from '../base/user-interaction/reducer';
import { IBreakoutRoomsState } from '../breakout-rooms/reducer';
import { ICalendarSyncState } from '../calendar-sync/reducer';
import { IChatState } from '../chat/reducer';
import { IDeepLinkingState } from '../deep-linking/reducer';
import { IDropboxState } from '../dropbox/reducer';
import { IDynamicBrandingState } from '../dynamic-branding/reducer';
import { IE2EEState } from '../e2ee/reducer';
import { IEtherpadState } from '../etherpad/reducer';
import { IFaceLandmarksState } from '../face-landmarks/reducer';
import { IFeedbackState } from '../feedback/reducer';
import { IFilmstripState } from '../filmstrip/reducer';
import { IFollowMeState } from '../follow-me/reducer';
import { IGifsState } from '../gifs/reducer';
import { IGoogleApiState } from '../google-api/reducer';
import { IInviteState } from '../invite/reducer';
import { IJaaSState } from '../jaas/reducer';
import { ILargeVideoState } from '../large-video/reducer';
import { ILobbyState } from '../lobby/reducer';
import { INoiseSuppressionState } from '../noise-suppression/reducer';

export interface IStore {
    dispatch: Function,
    getState: Function
}

export interface IState {
    'features/analytics': IAnalyticsState,
    'features/authentication': IAuthenticationState,
    'features/av-moderation': IAVModerationState,
    'features/base/app': IAppState,
    'features/base/audio-only': IAudioOnlyState,
    'features/base/conference': IConferenceState,
    'features/base/config': IConfig,
    'features/base/connection': IConnectionState,
    'features/base/devices': IDevicesState,
    'features/base/dialog': IDialogState,
    'features/base/flags': IFlagsState,
    'features/base/jwt': IJwtState,
    'features/base/known-domains': Array<string>,
    'features/base/lastn': ILastNState,
    'features/base/lib-jitsi-meet': ILibJitsiMeetState,
    'features/base/logging': ILoggingState,
    'features/base/media': IMediaState,
    'features/base/net-info': INetInfoState,
    'features/base/no-src-data': INoSrcDataState,
    'features/base/participants': IParticipantsState,
    'features/base/responsive-ui': IResponsiveUIState,
    'features/base/settings': ISettingsState,
    'features/base/sounds': ISoundsState,
    'features/base/tracks': ITracksState,
    'features/base/user-interaction': IUserInteractionState,
    'features/breakout-rooms': IBreakoutRoomsState,
    'features/calendar-sync': ICalendarSyncState,
    'features/chat': IChatState,
    'features/deep-linking': IDeepLinkingState,
    'features/dropbox': IDropboxState,
    'features/dynamic-branding': IDynamicBrandingState,
    'features/e2ee': IE2EEState,
    'features/etherpad': IEtherpadState,
    'features/face-landmarks': IFaceLandmarksState,
    'features/feedback': IFeedbackState,
    'features/filmstrip': IFilmstripState,
    'features/follow-me': IFollowMeState,
    'features/gifs': IGifsState,
    'features/google-api': IGoogleApiState,
    'features/invite': IInviteState,
    'features/jaas': IJaaSState,
    'features/large-video': ILargeVideoState,
    'features/lobby': ILobbyState,
    'features/noise-suppression': INoiseSuppressionState,
    'features/testing': ITestingState
}
