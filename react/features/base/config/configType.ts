import { ToolbarButton } from '../../toolbox/types';
import { ILoggingConfig } from '../logging/types';
import { DesktopSharingSourceType } from '../tracks/types';

type ButtonsWithNotifyClick = 'camera' |
    'chat' |
    'closedcaptions' |
    'desktop' |
    'download' |
    'embedmeeting' |
    'end-meeting' |
    'etherpad' |
    'feedback' |
    'filmstrip' |
    'fullscreen' |
    'hangup' |
    'hangup-menu' |
    'help' |
    'invite' |
    'livestreaming' |
    'microphone' |
    'mute-everyone' |
    'mute-video-everyone' |
    'participants-pane' |
    'profile' |
    'raisehand' |
    'recording' |
    'security' |
    'select-background' |
    'settings' |
    'shareaudio' |
    'sharedvideo' |
    'shortcuts' |
    'stats' |
    'tileview' |
    'toggle-camera' |
    'videoquality' |
    'add-passcode' |
    '__end';

type ParticipantMenuButtonsWithNotifyClick = 'allow-video' |
    'ask-unmute' |
    'conn-status' |
    'flip-local-video' |
    'grant-moderator' |
    'hide-self-view' |
    'kick' |
    'mute' |
    'mute-others' |
    'mute-others-video' |
    'mute-video' |
    'pinToStage' |
    'privateMessage' |
    'remote-control' |
    'send-participant-to-room' |
    'verify';

type NotifyClickButtonKey = string |
    ButtonsWithNotifyClick |
    ParticipantMenuButtonsWithNotifyClick;

export type NotifyClickButton = NotifyClickButtonKey |
    {
        key: NotifyClickButtonKey;
        preventExecution: boolean;
    };

export type Sounds = 'ASKED_TO_UNMUTE_SOUND' |
    'E2EE_OFF_SOUND' |
    'E2EE_ON_SOUND' |
    'INCOMING_MSG_SOUND' |
    'KNOCKING_PARTICIPANT_SOUND' |
    'LIVE_STREAMING_OFF_SOUND' |
    'LIVE_STREAMING_ON_SOUND' |
    'NO_AUDIO_SIGNAL_SOUND' |
    'NOISY_AUDIO_INPUT_SOUND' |
    'OUTGOING_CALL_EXPIRED_SOUND' |
    'OUTGOING_CALL_REJECTED_SOUND' |
    'OUTGOING_CALL_RINGING_SOUND' |
    'OUTGOING_CALL_START_SOUND' |
    'PARTICIPANT_JOINED_SOUND' |
    'PARTICIPANT_LEFT_SOUND' |
    'RAISE_HAND_SOUND' |
    'REACTION_SOUND' |
    'RECORDING_OFF_SOUND' |
    'RECORDING_ON_SOUND' |
    'TALK_WHILE_MUTED_SOUND';


export interface IMobileDynamicLink {
    apn: string;
    appCode: string;
    customDomain?: string;
    ibi: string;
    isi: string;
}

export interface IDeeplinkingPlatformConfig {
    appName: string;
    appScheme: string;
}

export interface IDeeplinkingMobileConfig extends IDeeplinkingPlatformConfig {
    appPackage?: string;
    downloadLink: string;
    dynamicLink?: IMobileDynamicLink;
    fDroidUrl?: string;
}

export interface IDesktopDownloadConfig {
    linux?: string;
    macos?: string;
    windows?: string;
}

export interface IDeeplinkingDesktopConfig extends IDeeplinkingPlatformConfig {
    download?: IDesktopDownloadConfig;
    enabled: boolean;
}

export interface IDeeplinkingConfig {
    android?: IDeeplinkingMobileConfig;
    desktop?: IDeeplinkingDesktopConfig;
    disabled?: boolean;
    hideLogo?: boolean;
    ios?: IDeeplinkingMobileConfig;
}

export type PartialRecord<K extends keyof any, T> = {
    [P in K]?: T;
};

export interface INoiseSuppressionConfig {
    krisp?: {
        bufferOverflowMS?: number;
        bvc?: {
            allowedDevices?: string;
            allowedDevicesExt?: string;
        };
        debugLogs: boolean;
        enableSessionStats?: boolean;
        enabled: boolean;
        inboundModels?: PartialRecord<string, string>;
        logProcessStats?: boolean;
        models?: PartialRecord<string, string>;
        preloadInboundModels?: PartialRecord<string, string>;
        preloadModels?: PartialRecord<string, string>;
        useBVC?: boolean;
        useSharedArrayBuffer?: boolean;
    };
}

export interface IWhiteboardConfig {
    collabServerBaseUrl?: string;
    enabled?: boolean;
    limitUrl?: string;
    userLimit?: number;
}

export interface IWatchRTCConfiguration {
    allowBrowserLogCollection?: boolean;
    collectionInterval?: number;
    console?: {
        level: string;
        override: boolean;
    };
    debug?: boolean;
    keys?: any;
    logGetStats?: boolean;
    proxyUrl?: string;
    rtcApiKey: string;
    rtcPeerId?: string;
    rtcRoomId?: string;
    rtcTags?: string[];
    rtcToken?: string;
    wsUrl?: string;
}

export interface IConfig {
    _desktopSharingSourceDevice?: string;
    _immediateReloadThreshold?: string;
    _screenshotHistoryRegionUrl?: number;
    analytics?: {
        amplitudeAPPKey?: string;
        amplitudeIncludeUTM?: boolean;
        blackListedEvents?: string[];
        disabled?: boolean;
        matomoEndpoint?: string;
        matomoSiteID?: string;
        obfuscateRoomName?: boolean;
        rtcstatsEnabled?: boolean;
        rtcstatsEndpoint?: string;
        rtcstatsLogFlushSizeBytes?: number;
        rtcstatsPollInterval?: number;
        rtcstatsSendSdp?: boolean;
        rtcstatsStoreLogs?: boolean;
        scriptURLs?: Array<string>;
        watchRTCEnabled?: boolean;
        whiteListedEvents?: string[];
    };
    apiLogLevels?: Array<'warn' | 'log' | 'error' | 'info' | 'debug'>;
    appId?: string;
    audioLevelsInterval?: number;
    audioQuality?: {
        opusMaxAverageBitrate?: number | null;
        stereo?: boolean;
    };
    autoCaptionOnRecord?: boolean;
    autoKnockLobby?: boolean;
    backgroundAlpha?: number;
    bosh?: string;
    brandingDataUrl?: string;
    brandingRoomAlias?: string;
    breakoutRooms?: {
        hideAddRoomButton?: boolean;
        hideAutoAssignButton?: boolean;
        hideJoinRoomButton?: boolean;
    };
    bridgeChannel?: {
        ignoreDomain?: string;
        preferSctp?: boolean;
    };
    buttonsWithNotifyClick?: Array<ButtonsWithNotifyClick | {
        key: ButtonsWithNotifyClick;
        preventExecution: boolean;
    }>;
    callDisplayName?: string;
    callFlowsEnabled?: boolean;
    callHandle?: string;
    callUUID?: string;
    cameraFacingMode?: string;
    channelLastN?: number;
    chromeExtensionBanner?: {
        chromeExtensionsInfo?: Array<{ id: string; path: string; }>;
        edgeUrl?: string;
        url?: string;
    };
    conferenceInfo?: {
        alwaysVisible?: Array<string>;
        autoHide?: Array<string>;
    };
    conferenceRequestUrl?: string;
    connectionIndicators?: {
        autoHide?: boolean;
        autoHideTimeout?: number;
        disableDetails?: boolean;
        disabled?: boolean;
        inactiveDisabled?: boolean;
    };
    constraints?: {
        video?: {
            height?: {
                ideal?: number;
                max?: number;
                min?: number;
            };
        };
    };
    corsAvatarURLs?: Array<string>;
    customParticipantMenuButtons?: Array<{ icon: string; id: string; text: string; }>;
    customToolbarButtons?: Array<{ backgroundColor?: string; icon: string; id: string; text: string; }>;
    deeplinking?: IDeeplinkingConfig;
    defaultLanguage?: string;
    defaultLocalDisplayName?: string;
    defaultLogoUrl?: string;
    defaultRemoteDisplayName?: string;
    deploymentInfo?: {
        envType?: string;
        environment?: string;
        product?: string;
        region?: string;
        shard?: string;
        userRegion?: string;
    };
    deploymentUrls?: {
        downloadAppsUrl?: string;
        userDocumentationURL?: string;
    };
    desktopSharingFrameRate?: {
        max?: number;
        min?: number;
    };
    desktopSharingSources?: Array<DesktopSharingSourceType>;
    dialInConfCodeUrl?: string;
    dialInNumbersUrl?: string;
    dialOutAuthUrl?: string;
    dialOutRegionUrl?: string;
    disable1On1Mode?: boolean | null;
    disableAEC?: boolean;
    disableAGC?: boolean;
    disableAP?: boolean;
    disableAddingBackgroundImages?: boolean;
    disableAudioLevels?: boolean;
    disableBeforeUnloadHandlers?: boolean;
    disableCameraTintForeground?: boolean;
    disableChatSmileys?: boolean;
    disableDeepLinking?: boolean;
    disableFilmstripAutohiding?: boolean;
    disableFocus?: boolean;
    disableIframeAPI?: boolean;
    disableIncomingMessageSound?: boolean;
    disableInitialGUM?: boolean;
    disableInviteFunctions?: boolean;
    disableJoinLeaveSounds?: boolean;
    disableLocalVideoFlip?: boolean;
    disableModeratorIndicator?: boolean;
    disableNS?: boolean;
    disablePolls?: boolean;
    disableProfile?: boolean;
    disableReactions?: boolean;
    disableReactionsModeration?: boolean;
    disableRecordAudioNotification?: boolean;
    disableRemoteControl?: boolean;
    disableRemoteMute?: boolean;
    disableRemoveRaisedHandOnFocus?: boolean;
    disableResponsiveTiles?: boolean;
    disableRtx?: boolean;
    disableSelfDemote?: boolean;
    disableSelfView?: boolean;
    disableSelfViewSettings?: boolean;
    disableShortcuts?: boolean;
    disableShowMoreStats?: boolean;
    disableSimulcast?: boolean;
    disableSpeakerStatsSearch?: boolean;
    disableThirdPartyRequests?: boolean;
    disableTileEnlargement?: boolean;
    disableTileView?: boolean;
    disableVirtualBackground?: boolean;
    disabledNotifications?: Array<string>;
    disabledSounds?: Array<Sounds>;
    displayJids?: boolean;
    doNotFlipLocalVideo?: boolean;
    doNotStoreRoom?: boolean;
    dropbox?: {
        appKey: string;
        redirectURI?: string;
    };
    dynamicBrandingUrl?: string;
    e2ee?: {
        disabled?: boolean;
        externallyManagedKey?: boolean;
        labels?: {
            description?: string;
            label?: string;
            tooltip?: string;
            warning?: string;
        };
    };
    e2eeLabels?: {
        description?: string;
        label?: string;
        tooltip?: string;
        warning?: string;
    };
    e2eping?: {
        enabled?: boolean;
        maxConferenceSize?: number;
        maxMessagesPerSecond?: number;
        numRequests?: number;
    };
    enableCalendarIntegration?: boolean;
    enableClosePage?: boolean;
    enableDisplayNameInStats?: boolean;
    enableEmailInStats?: boolean;
    enableEncodedTransformSupport?: boolean;
    enableForcedReload?: boolean;
    enableInsecureRoomNameWarning?: boolean;
    enableLobbyChat?: boolean;
    enableNoAudioDetection?: boolean;
    enableNoisyMicDetection?: boolean;
    enableOpusRed?: boolean;
    enableRemb?: boolean;
    enableSaveLogs?: boolean;
    enableTalkWhileMuted?: boolean;
    enableTcc?: boolean;
    enableWebHIDFeature?: boolean;
    enableWelcomePage?: boolean;
    etherpad_base?: string;
    faceLandmarks?: {
        captureInterval?: number;
        enableDisplayFaceExpressions?: boolean;
        enableFaceCentering?: boolean;
        enableFaceExpressionsDetection?: boolean;
        enableRTCStats?: boolean;
        faceCenteringThreshold?: number;
    };
    feedbackPercentage?: number;
    fileRecordingsServiceEnabled?: boolean;
    fileRecordingsServiceSharingEnabled?: boolean;
    filmstrip?: {
        disableResizable?: boolean;
        disableStageFilmstrip?: boolean;
        disableTopPanel?: boolean;
        disabled?: boolean;
        minParticipantCountForTopPanel?: number;
    };
    flags?: {
        ssrcRewritingEnabled: boolean;
    };
    focusUserJid?: string;
    forceTurnRelay?: boolean;
    gatherStats?: boolean;
    giphy?: {
        displayMode?: 'all' | 'tile' | 'chat';
        enabled?: boolean;
        rating?: 'g' | 'pg' | 'pg-13' | 'r';
        sdkKey?: string;
        tileTime?: number;
    };
    googleApiApplicationClientID?: string;
    gravatar?: {
        baseUrl?: string;
        disabled?: boolean;
    };
    gravatarBaseURL?: string;
    guestDialOutStatusUrl?: string;
    guestDialOutUrl?: string;
    helpCentreURL?: string;
    hiddenDomain?: string;
    hiddenPremeetingButtons?: Array<'microphone' | 'camera' | 'select-background' | 'invite' | 'settings'>;
    hideAddRoomButton?: boolean;
    hideConferenceSubject?: boolean;
    hideConferenceTimer?: boolean;
    hideDisplayName?: boolean;
    hideDominantSpeakerBadge?: boolean;
    hideEmailInSettings?: boolean;
    hideLobbyButton?: boolean;
    hideLoginButton?: boolean;
    hideParticipantsStats?: boolean;
    hideRecordingLabel?: boolean;
    hosts?: {
        anonymousdomain?: string;
        authdomain?: string;
        domain: string;
        focus?: string;
        muc: string;
        visitorFocus?: string;
    };
    iAmRecorder?: boolean;
    iAmSipGateway?: boolean;
    ignoreStartMuted?: boolean;
    inviteAppName?: string | null;
    inviteServiceCallFlowsUrl?: string;
    inviteServiceUrl?: string;
    jaasActuatorUrl?: string;
    jaasConferenceCreatorUrl?: string;
    jaasFeedbackMetadataURL?: string;
    jaasTokenUrl?: string;
    legalUrls?: {
        helpCentre: string;
        privacy: string;
        security: string;
        terms: string;
    };
    liveStreaming?: {
        dataPrivacyLink?: string;
        enabled?: boolean;
        helpLink?: string;
        termsLink?: string;
        validatorRegExpString?: string;
    };
    liveStreamingEnabled?: boolean;
    lobby?: {
        autoKnock?: boolean;
        enableChat?: boolean;
    };
    localRecording?: {
        disable?: boolean;
        disableSelfRecording?: boolean;
        notifyAllParticipants?: boolean;
    };
    localSubject?: string;
    locationURL?: URL;
    logging?: ILoggingConfig;
    mainToolbarButtons?: Array<Array<string>>;
    maxFullResolutionParticipants?: number;
    microsoftApiApplicationClientID?: string;
    moderatedRoomServiceUrl?: string;
    mouseMoveCallbackInterval?: number;
    noiseSuppression?: INoiseSuppressionConfig;
    noticeMessage?: string;
    notificationTimeouts?: {
        extraLong?: number;
        long?: number;
        medium?: number;
        short?: number;
    };
    notifications?: Array<string>;
    notifyOnConferenceDestruction?: boolean;
    openSharedDocumentOnJoin?: boolean;
    opusMaxAverageBitrate?: number;
    p2p?: {
        backToP2PDelay?: number;
        codecPreferenceOrder?: Array<string>;
        enabled?: boolean;
        iceTransportPolicy?: string;
        mobileCodecPreferenceOrder?: Array<string>;
        mobileScreenshareCodec?: string;
        stunServers?: Array<{ urls: string; }>;
    };
    participantMenuButtonsWithNotifyClick?: Array<string | ParticipantMenuButtonsWithNotifyClick | {
        key: string | ParticipantMenuButtonsWithNotifyClick;
        preventExecution: boolean;
    }>;
    participantsPane?: {
        enabled?: boolean;
        hideModeratorSettingsTab?: boolean;
        hideMoreActionsButton?: boolean;
        hideMuteAllButton?: boolean;
    };
    pcStatsInterval?: number;
    peopleSearchQueryTypes?: string[];
    peopleSearchTokenLocation?: string;
    peopleSearchUrl?: string;
    preferBosh?: boolean;
    preferVisitor?: boolean;
    preferredTranscribeLanguage?: string;
    prejoinConfig?: {
        enabled?: boolean;
        hideDisplayName?: boolean;
        hideExtraJoinButtons?: Array<string>;
        preCallTestEnabled?: boolean;
        preCallTestICEUrl?: string;
    };
    prejoinPageEnabled?: boolean;
    raisedHands?: {
        disableLowerHandByModerator?: boolean;
        disableLowerHandNotification?: boolean;
        disableNextSpeakerNotification?: boolean;
        disableRemoveRaisedHandOnFocus?: boolean;
    };
    readOnlyName?: boolean;
    recordingLimit?: {
        appName?: string;
        appURL?: string;
        limit?: number;
    };
    recordingService?: {
        enabled?: boolean;
        hideStorageWarning?: boolean;
        sharingEnabled?: boolean;
    };
    recordingSharingUrl?: string;
    recordings?: {
        recordAudioAndVideo?: boolean;
        requireConsent?: boolean;
        showPrejoinWarning?: boolean;
        showRecordingLink?: boolean;
        suggestRecording?: boolean;
    };
    remoteVideoMenu?: {
        disableDemote?: boolean;
        disableGrantModerator?: boolean;
        disableKick?: boolean;
        disablePrivateChat?: boolean;
        disabled?: boolean;
    };
    replaceParticipant?: string;
    requireDisplayName?: boolean;
    resolution?: number;
    roomPasswordNumberOfDigits?: number;
    salesforceUrl?: string;
    screenshotCapture?: {
        enabled?: boolean;
        mode?: 'always' | 'recording';
    };
    securityUi?: {
        disableLobbyPassword?: boolean;
        hideLobbyButton?: boolean;
    };
    serviceUrl?: string;
    sharedVideoAllowedURLDomains?: Array<string>;
    sipInviteUrl?: string;
    speakerStats?: {
        disableSearch?: boolean;
        disabled?: boolean;
        order?: Array<'role' | 'name' | 'hasLeft'>;
    };
    speakerStatsOrder?: Array<'role' | 'name' | 'hasLeft'>;
    startAudioMuted?: number;
    startAudioOnly?: boolean;
    startLastN?: number;
    startScreenSharing?: boolean;
    startSilent?: boolean;
    startVideoMuted?: number;
    startWithAudioMuted?: boolean;
    startWithVideoMuted?: boolean;
    stereo?: boolean;
    subject?: string;
    testing?: {
        assumeBandwidth?: boolean;
        debugAudioLevels?: boolean;
        dumpTranscript?: boolean;
        failICE?: boolean;
        noAutoPlayVideo?: boolean;
        p2pTestMode?: boolean;
        skipInterimTranscriptions?: boolean;
        testMode?: boolean;
    };
    tileView?: {
        disabled?: boolean;
        numberOfVisibleTiles?: number;
    };
    tokenAuthUrl?: string;
    tokenAuthUrlAutoRedirect?: string;
    tokenLogoutUrl?: string;
    tokenRespectTenant?: string;
    toolbarButtons?: Array<ToolbarButton>;
    toolbarConfig?: {
        alwaysVisible?: boolean;
        autoHideWhileChatIsOpen?: boolean;
        initialTimeout?: number;
        timeout?: number;
    };
    transcribeWithAppLanguage?: boolean;
    transcribingEnabled?: boolean;
    transcription?: {
        autoCaptionOnTranscribe?: boolean;
        autoTranscribeOnRecord?: boolean;
        enabled?: boolean;
        preferredLanguage?: string;
        translationLanguages?: Array<string>;
        translationLanguagesHead?: Array<string>;
        useAppLanguage?: boolean;
    };
    useHostPageLocalStorage?: boolean;
    useTurnUdp?: boolean;
    videoQuality?: {
        codecPreferenceOrder?: Array<string>;
        maxBitratesVideo?: {
            [key: string]: {
                high?: number;
                low?: number;
                standard?: number;
            };
        };
        minHeightForQualityLvl?: {
            [key: number]: string;
        };
        mobileCodecPreferenceOrder?: Array<string>;
        persist?: boolean;
    };
    visitors?: {
        enableMediaOnPromote?: {
            audio?: boolean;
            video?: boolean;
        };
        queueService: string;
    };
    watchRTCConfigParams?: IWatchRTCConfiguration;
    webhookProxyUrl?: string;
    webrtcIceTcpDisable?: boolean;
    webrtcIceUdpDisable?: boolean;
    websocket?: string;
    websocketKeepAliveUrl?: string;
    welcomePage?: {
        customUrl?: string;
        disabled?: boolean;
    };
    whiteboard?: IWhiteboardConfig;
}
