type ToolbarButtons = 'camera' |
    'chat' |
    'closedcaptions' |
    'desktop' |
    'dock-iframe' |
    'download' |
    'embedmeeting' |
    'etherpad' |
    'feedback' |
    'filmstrip' |
    'fullscreen' |
    'hangup' |
    'help' |
    'highlight' |
    'invite' |
    'linktosalesforce' |
    'livestreaming' |
    'microphone' |
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
    'undock-iframe' |
    'videoquality' |
    '__end';

type ButtonsWithNotifyClick = 'camera' |
    'chat' |
    'closedcaptions' |
    'desktop' |
    'download' |
    'embedmeeting' |
    'etherpad' |
    'feedback' |
    'filmstrip' |
    'fullscreen' |
    'hangup' |
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

type Sounds = 'ASKED_TO_UNMUTE_SOUND' |
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

export interface IConfig {
    hosts?: {
        domain: string;
        anonymousdomain?: string;
        authdomain?: string;
        focus?: string;
        muc: string;
    };
    bosh?: string;
    websocket?: string;
    focusUserJid?: string;
    testing?: {
        disableE2EE?: boolean;
        enableThumbnailReordering?: boolean;
        mobileXmppWsThreshold?: number;
        p2pTestMode?: boolean;
        testMode?: boolean;
        noAutoPlayVideo?: boolean;
        capScreenshareBitrate?: number;
        setScreenSharingResolutionConstraints?: boolean;
        callStatsThreshold?: number;
    };
    flags?: {
        sourceNameSignaling?: boolean;
        sendMultipleVideoStreams?: boolean;
    };
    disableModeratorIndicator?: boolean;
    disableReactions?: boolean;
    disableReactionsModeration?: boolean;
    disablePolls?: boolean;
    disableSelfView?: boolean;
    disableSelfViewSettings?: boolean;
    screenshotCapture?: {
        enabled?: boolean;
        mode?: 'always' | 'recording';
    };
    webrtcIceUdpDisable?: boolean;
    webrtcIceTcpDisable?: boolean;
    enableUnifiedOnChrome?: boolean;
    disableAudioLevels?: boolean;
    audioLevelsInterval?: number;
    enableNoAudioDetection?: boolean;
    enableSaveLogs?: boolean;
    disableShowMoreStats?: boolean;
    enableNoisyMicDetection?: boolean;
    startAudioOnly?: boolean;
    startAudioMuted?: boolean;
    startWithAudioMuted?: boolean;
    startSilent?: boolean;
    enableOpusRed?: boolean;
    audioQuality?: {
        stereo?: boolean;
        opusMaxAverageBitrate?: number|null;
    };
    stereo?: boolean;
    opusMaxAverageBitrate?: number;
    resolution?: number;
    disableRemoveRaisedHandOnFocus?: boolean;
    disableSpeakerStatsSearch?: boolean;
    speakerStatsOrder?: Array<'role'|'name'|'hasLeft'>;
    maxFullResolutionParticipants?: number;
    constraints?: {
        video?: {
            height?: {
                ideal?: number;
                max?: number;
                min?: number;
            }
        }
    };
    disableSimulcast?: boolean;
    enableLayerSuspension?: boolean;
    startVideoMuted?: number;
    startWithVideoMuted?: boolean;
    preferH264?: boolean;
    disableH264?: boolean;
    desktopSharingFrameRate?: {
        min?: number;
        max?: number;
    };
    startScreenSharing?: boolean;
    fileRecordingsEnabled?: boolean;
    dropbox?: {
        appKey: string;
        redirectURI?: string;
    };
    recordingService?: {
        enabled?: boolean;
        sharingEnabled?: boolean;
        hideStorageWarning?: boolean;
    };
    fileRecordingsServiceEnabled?: boolean;
    fileRecordingsServiceSharingEnabled?: boolean;
    liveStreamingEnabled?: boolean;
    localRecording?: {
        disable?: boolean;
        notifyAllParticipants?: boolean;
    };
    transcribingEnabled?: boolean;
    transcribeWithAppLanguage?:  boolean;
    preferredTranscribeLanguage?: string;
    autoCaptionOnRecord?: boolean;
    transcription?: {
        enabled?: boolean;
        useAppLanguage?: boolean;
        preferredLanguage?: string;
        disableStartForAll?: boolean;
        autoCaptionOnRecord?: boolean;
    };
    channelLastN?: number;
    connectionIndicators?: {
        autoHide?: boolean;
        autoHideTimeout?: number;
        disabled?: boolean;
        disableDetails?: boolean;
        inactiveDisabled?: boolean;
    };
    startLastN?: number;
    lastNLimits?: {
        [key: number]: number;
    };
    useNewBandwidthAllocationStrategy?: boolean;
    videoQuality?: {
        disabledCodec?: string;
        preferredCodec?: string;
        enforcePreferredCodec?: boolean;
        maxBitratesVideo?: {
            [key: string]: {
                low?: number;
                standard?: number;
                high?: number;
            }
        };
        minHeightForQualityLvl: {
            [key: number]: string;
        };
        resizeDesktopForPresenter?: boolean;
    };
    notificationTimeouts?: {
        short?: number;
        medium?: number;
        long?: number;
    };
    recordingLimit?: {
        limit?: number;
        appName?: string;
        appURL?: string;
    };
    disableRtx?: boolean;
    disableBeforeUnloadHandlers?: boolean;
    enableTcc?: boolean;
    enableRemb?: boolean;
    enableIceRestart?: boolean;
    enableForcedReload?: boolean;
    useTurnUdp?: boolean;
    enableEncodedTransformSupport?: boolean;
    disableResponsiveTiles?: boolean;
    hideLobbyButton?: boolean;
    autoKnockLobby?: boolean;
    enableLobbyChat?: boolean;
    hideAddRoomButton?: boolean;
    requireDisplayName?: boolean;
    enableWelcomePage?: boolean;
    disableShortcuts?: boolean;
    disableInitialGUM?: boolean;
    enableClosePage?: boolean;
    disable1On1Mode?: boolean|null;
    defaultLocalDisplayName?: string;
    defaultRemoteDisplayName?: string;
    hideDisplayName?: boolean;
    hideDominantSpeakerBadge?: boolean;
    defaultLanguage?: string;
    disableProfile?: boolean;
    hideEmailInSettings?: boolean;
    enableFeaturesBasedOnToken?: boolean;
    roomPasswordNumberOfDigits?: number;
    noticeMessage?: string;
    enableCalendarIntegration?: boolean;
    prejoinConfig?: {
        enabled?: boolean;
        hideDisplayName?: boolean;
        hideExtraJoinButtons?: Array<string>;
    };
    prejoinPageEnabled?: boolean;
    readOnlyName?: boolean;
    openSharedDocumentOnJoin?: boolean;
    enableInsecureRoomNameWarning?: boolean;
    enableAutomaticUrlCopy?: boolean;
    corsAvatarURLs?: Array<string>;
    gravatarBaseURL?: string;
    gravatar?: {
        baseUrl?: string;
        disabled?: boolean;
    };
    inviteAppName?: string|null;
    toolbarButtons?: Array<ToolbarButtons>;
    toolbarConfig?: {
        initialTimeout?: number;
        timeout?: number;
        alwaysVisible?: boolean;
        autoHideWhileChatIsOpen?: boolean;
    };
    buttonsWithNotifyClick?: Array<ButtonsWithNotifyClick | { key: ButtonsWithNotifyClick; preventExecution: boolean }>;
    hiddenPremeetingButtons?: Array<'microphone' | 'camera' | 'select-background' | 'invite' | 'settings'>;
    gatherStats?: boolean;
    pcStatsInterval?: number;
    callStatsID?: string;
    callStatsSecret?: string;
    callStatsConfigParams?: {
        disableBeforeUnloadHandler?: boolean;
        applicationVersion?: string;
        disablePrecalltest?: boolean;
        siteID?: string;
        additionalIDs?: {
            customerID?: string;
            tenantID?: string;
            productName?: string;
            meetingsName?: string;
            serverName?: string;
            pbxID?: string;
            pbxExtensionID?: string;
            fqExtensionID?: string;
            sessionID?: string;
        };
        collectLegacyStats?: boolean;
        collectIP?: boolean;
    };
    enableDisplayNameInStats?: boolean;
    enableEmailInStats?: boolean;
    faceLandmarks?: {
        enableFaceCentering?: boolean;
        enableFaceExpressionsDetection?: boolean;
        enableDisplayFaceExpressions?: boolean;
        enableRTCStats?: boolean;
        faceCenteringThreshold?: number;
        captureInterval?: number;
    };
    feedbackPercentage?: number;
    disableThirdPartyRequests?: boolean;
    p2p?: {
        enabled?: boolean;
        enableUnifiedOnChrome?: boolean;
        iceTransportPolicy?: string;
        preferH264?: boolean;
        preferredCodec?: string;
        disableH264?: boolean;
        disabledCodec?: string;
        backToP2PDelay?: number;
        stunServers?: Array<{urls: string}>;
    };
    analytics?: {
        disabled?: boolean;
        googleAnalyticsTrackingId?: string;
        matomoEndpoint?: string;
        matomoSiteID?: string;
        amplitudeAPPKey?: string;
        obfuscateRoomName?: boolean;
        rtcstatsEnabled?: boolean;
        rtcstatsEndpoint?: string;
        rtcstatsPolIInterval?: number;
        scriptURLs?: Array<string>;
    };
    apiLogLevels?: Array<'warn' | 'log' | 'error' | 'info' | 'debug'>;
    deploymentInfo?: {
        shard?: string;
        region?: string;
        userRegion?: string;
    };
    disabledSounds?: Array<Sounds>;
    disableRecordAudioNotification?: boolean;
    disableJoinLeaveSounds?: boolean;
    disableIncomingMessageSound?: boolean;
    chromeExtensionBanner?: {
        url?: string;
        edgeUrl?: string;
        chromeExtensionsInfo?: Array<{id: string; path: string}>;
    };
    e2ee?: {
        labels?: {
            tooltip?: string;
            description?: string;
            label?: string;
            warning?: string;
        };
        externallyManagedKey?: boolean;
        e2eeLabels?: {
            tooltip?: string;
            description?: string;
            label?: string;
            warning?: string;
        };
    };
    e2eeLabels?: {
        tooltip?: string;
        description?: string;
        label?: string;
        warning?: string;
    };
    e2eping?: {
        enabled?: boolean;
        numRequests?: number;
        maxConferenceSize?: number;
        maxMessagesPerSecond?: number;
    };
    _desktopSharingSourceDevice?: string;
    disableDeepLinking?: boolean;
    disableLocalVideoFlip?: boolean;
    doNotFlipLocalVideo?: boolean;
    disableInviteFunctions?: boolean;
    doNotStoreRoom?: boolean;
    deploymentUrls?: {
        userDocumentationURL?: string;
        downloadAppsUrl?: string;
    };
    remoteVideoMenu?: {
        disabled?: boolean;
        disableKick?: boolean;
        disableGrantModerator?: boolean;
        disablePrivateChat?: boolean;
    };
    salesforceUrl?: string;
    disableRemoteMute?: boolean;
    enableLipSync?: boolean;
    dynamicBrandingUrl?: string;
    participantsPane?: {
        hideModeratorSettingsTab?: boolean;
        hideMoreActionsButton?: boolean;
        hideMuteAllButton?: boolean;
    };
    breakoutRooms?: {
        hideAddRoomButton?: boolean;
        hideAutoAssignButton?: boolean;
        hideJoinRoomButton?: boolean;
    };
    disableAddingBackgroundImages?: boolean;
    disableScreensharingVirtualBackground?: boolean;
    backgroundAlpha?: number;
    moderatedRoomServiceUrl?: string;
    disableTileView?: boolean;
    disableTileEnlargement?: boolean;
    conferenceInfo?: {
        alwaysVisible?: Array<string>;
        autoHide?: Array<string>;
    };
    hideConferenceSubject?: boolean;
    hideConferenceTimer?: boolean;
    hideRecordingLabel?: boolean;
    hideParticipantsStats?: boolean;
    subject?: string;
    localSubject?: string;
    useHostPageLocalStorage?: boolean;
    etherpad_base?: string;
    dialInNumbersUrl?: string;
    dialInConfCodeUrl?: string;
    brandingRoomAlias?: string;
    mouseMoveCallbackInterval?: number;
    notifications?: Array<string>;
    disabledNotifications?: Array<string>;
    disableFilmstripAutohiding?: boolean;
    filmstrip?: {
        disableResizable?: boolean;
        disableStageFilmstrip?: boolean;
        disableTopPanel?: boolean;
        minParticipantCountForTopPanel?: number;
    };
    tileView?: {
        numberOfVisibleTiles?: number;
    };
    disableChatSmileys?: boolean;
    giphy?: {
        enabled?: boolean;
        sdkKey?: '';
        displayMode?: 'all' | 'tile' | 'chat';
        tileTime?: number;
    };
    locationURL?: string;
}