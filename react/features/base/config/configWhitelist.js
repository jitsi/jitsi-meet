import extraConfigWhitelist from './extraConfigWhitelist';

/**
 * The config keys to whitelist, the keys that can be overridden.
 * Whitelisting a key allows all properties under that key to be overridden.
 * For example whitelisting 'p2p' allows 'p2p.enabled' to be overridden, and
 * overriding 'p2p.enabled' does not modify any other keys under 'p2p'.
 * The whitelist is used only for config.js.
 *
 * @type Array
 */
export default [
    '_desktopSharingSourceDevice',
    '_peerConnStatusOutOfLastNTimeout',
    '_peerConnStatusRtcMuteTimeout',
    'abTesting',
    'analytics.disabled',
    'analytics.rtcstatsEnabled',
    'audioLevelsInterval',
    'audioQuality',
    'autoKnockLobby',
    'apiLogLevels',
    'avgRtpStatsN',
    'backgroundAlpha',
    'breakoutRooms',
    'buttonsWithNotifyClick',

    /**
     * The display name of the CallKit call representing the conference/meeting
     * associated with this config.js including while the call is ongoing in the
     * UI presented by CallKit and in the system-wide call history. The property
     * is meant for use cases in which the room name is not desirable as a
     * display name for CallKit purposes and the desired display name is not
     * provided in the form of a JWT callee. As the value is associated with a
     * conference/meeting, the value makes sense not as a deployment-wide
     * configuration, only as a runtime configuration override/overwrite
     * provided by, for example, Jitsi Meet SDK for iOS.
     *
     * @type string
     */
    'callDisplayName',
    'callFlowsEnabled',

    /**
     * The handle
     * ({@link https://developer.apple.com/documentation/callkit/cxhandle}) of
     * the CallKit call representing the conference/meeting associated with this
     * config.js. The property is meant for use cases in which the room URL is
     * not desirable as the handle for CallKit purposes. As the value is
     * associated with a conference/meeting, the value makes sense not as a
     * deployment-wide configuration, only as a runtime configuration
     * override/overwrite provided by, for example, Jitsi Meet SDK for iOS.
     *
     * @type string
     */
    'callHandle',
    'callStatsConfIDNamespace',
    'callStatsConfigParams',
    'callStatsID',
    'callStatsSecret',

    /**
     * The UUID of the CallKit call representing the conference/meeting
     * associated with this config.js. The property is meant for use cases in
     * which Jitsi Meet is to work with a CallKit call created outside of Jitsi
     * Meet and to be adopted by Jitsi Meet such as, for example, an incoming
     * and/or outgoing CallKit call created by Jitsi Meet SDK for iOS
     * clients/consumers prior to giving control to Jitsi Meet. As the value is
     * associated with a conference/meeting, the value makes sense not as a
     * deployment-wide configuration, only as a runtime configuration
     * override/overwrite provided by, for example, Jitsi Meet SDK for iOS.
     *
     * @type string
     */
    'callUUID',

    'conferenceInfo',
    'channelLastN',
    'connectionIndicators',
    'constraints',
    'brandingRoomAlias',
    'debug',
    'debugAudioLevels',
    'defaultLocalDisplayName',
    'defaultRemoteDisplayName',
    'desktopSharingFrameRate',
    'desktopSharingSources',
    'disable1On1Mode',
    'disableAEC',
    'disableAGC',
    'disableAP',
    'disableAddingBackgroundImages',
    'disableAudioLevels',
    'disableBeforeUnloadHandlers',
    'disableChatSmileys',
    'disableDeepLinking',
    'disabledSounds',
    'disableFilmstripAutohiding',
    'disableInitialGUM',
    'disableH264',
    'disableHPF',
    'disableInviteFunctions',
    'disableIncomingMessageSound',
    'disableJoinLeaveSounds',
    'disableLocalVideoFlip',
    'disableModeratorIndicator',
    'disableNS',
    'disablePolls',
    'disableProfile',
    'disableReactions',
    'disableReactionsModeration',
    'disableRecordAudioNotification',
    'disableRemoteControl',
    'disableRemoteMute',
    'disableResponsiveTiles',
    'disableRtx',
    'disableSelfView',
    'disableSelfViewSettings',
    'disableScreensharingVirtualBackground',
    'disableShortcuts',
    'disableShowMoreStats',
    'disableRemoveRaisedHandOnFocus',
    'disableSpeakerStatsSearch',
    'speakerStatsOrder',
    'disableSimulcast',
    'disableThirdPartyRequests',
    'disableTileView',
    'disableTileEnlargement',
    'displayJids',
    'doNotStoreRoom',
    'doNotFlipLocalVideo',
    'dropbox',
    'e2eeLabels',
    'e2ee',
    'e2eping',
    'enableDisplayNameInStats',
    'enableEmailInStats',
    'enableEncodedTransformSupport',
    'enableFacialRecognition',
    'enableIceRestart',
    'enableInsecureRoomNameWarning',
    'enableLayerSuspension',
    'enableLipSync',
    'enableLobbyChat',
    'enableOpusRed',
    'enableRemb',
    'enableSaveLogs',
    'enableTalkWhileMuted',
    'enableUnifiedOnChrome',
    'enableNoAudioDetection',
    'enableNoisyMicDetection',
    'enableTcc',
    'enableAutomaticUrlCopy',
    'etherpad_base',
    'faceCoordinatesSharing',
    'failICE',
    'feedbackPercentage',
    'fileRecordingsEnabled',
    'filmstrip',
    'firefox_fake_device',
    'flags',
    'forceJVB121Ratio',
    'forceTurnRelay',
    'gatherStats',
    'giphy',
    'googleApiApplicationClientID',
    'hiddenPremeetingButtons',
    'hideConferenceSubject',
    'hideDisplayName',
    'hideDominantSpeakerBadge',
    'hideRecordingLabel',
    'hideParticipantsStats',
    'hideConferenceTimer',
    'hiddenDomain',
    'hideAddRoomButton',
    'hideEmailInSettings',
    'hideLobbyButton',
    'hosts',
    'iAmRecorder',
    'iAmSipGateway',
    'iceTransportPolicy',
    'ignoreStartMuted',
    'inviteAppName',
    'liveStreamingEnabled',
    'localRecording',
    'localSubject',
    'maxFullResolutionParticipants',
    'mouseMoveCallbackInterval',
    'notifications',
    'notificationTimeouts',
    'openSharedDocumentOnJoin',
    'opusMaxAverageBitrate',
    'p2p',
    'pcStatsInterval',
    'preferH264',
    'preferredCodec',
    'prejoinConfig',
    'prejoinPageEnabled',
    'requireDisplayName',
    'remoteVideoMenu',
    'roomPasswordNumberOfDigits',
    'readOnlyName',
    'replaceParticipant',
    'resolution',
    'salesforceUrl',
    'screenshotCapture',
    'startAudioMuted',
    'startAudioOnly',
    'startLastN',
    'startScreenSharing',
    'startSilent',
    'startVideoMuted',
    'startWithAudioMuted',
    'startWithVideoMuted',
    'stereo',
    'subject',
    'testing',
    'toolbarButtons',
    'toolbarConfig',
    'tileView',
    'transcribingEnabled',
    'useHostPageLocalStorage',
    'useTurnUdp',
    'videoQuality',
    'webrtcIceTcpDisable',
    'webrtcIceUdpDisable'
].concat(extraConfigWhitelist);
