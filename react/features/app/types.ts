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
    'features/noise-suppression': INoiseSuppressionState
}
