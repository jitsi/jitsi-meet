{{ $DEPLOYMENTINFO_USERREGION := .Env.DEPLOYMENTINFO_USERREGION | default "" -}}
{{ $ENABLE_AUDIO_PROCESSING := .Env.ENABLE_AUDIO_PROCESSING | default "true" | toBool -}}
{{ $ENABLE_CALENDAR := .Env.ENABLE_CALENDAR | default "false" | toBool -}}
{{ $ENABLE_FILE_RECORDING_SERVICE := .Env.ENABLE_FILE_RECORDING_SERVICE | default "false" | toBool -}}
{{ $ENABLE_FILE_RECORDING_SERVICE_SHARING := .Env.ENABLE_FILE_RECORDING_SERVICE_SHARING | default "false" | toBool -}}
{{ $ENABLE_IPV6 := .Env.ENABLE_IPV6 | default "true" | toBool -}}
{{ $ENABLE_LIPSYNC := .Env.ENABLE_LIPSYNC | default "false" | toBool -}}
{{ $ENABLE_NO_AUDIO_DETECTION := .Env.ENABLE_NO_AUDIO_DETECTION | default "false" | toBool -}}
{{ $ENABLE_P2P := .Env.ENABLE_P2P | default "true" | toBool -}}
{{ $ENABLE_PREJOIN_PAGE := .Env.ENABLE_PREJOIN_PAGE | default "false" | toBool -}}
{{ $ENABLE_WELCOME_PAGE := .Env.ENABLE_WELCOME_PAGE | default "true" | toBool -}}
{{ $ENABLE_CLOSE_PAGE := .Env.ENABLE_CLOSE_PAGE | default "false" | toBool -}}
{{ $ENABLE_RECORDING := .Env.ENABLE_RECORDING | default "false" | toBool -}}
{{ $ENABLE_REMB := .Env.ENABLE_REMB | default "true" | toBool -}}
{{ $ENABLE_REQUIRE_DISPLAY_NAME := .Env.ENABLE_REQUIRE_DISPLAY_NAME | default "false" | toBool -}}
{{ $ENABLE_SIMULCAST := .Env.ENABLE_SIMULCAST | default "true" | toBool -}}
{{ $ENABLE_STATS_ID := .Env.ENABLE_STATS_ID | default "false" | toBool -}}
{{ $ENABLE_STEREO := .Env.ENABLE_STEREO | default "false" | toBool -}}
{{ $ENABLE_TALK_WHILE_MUTED := .Env.ENABLE_TALK_WHILE_MUTED | default "false" | toBool -}}
{{ $ENABLE_TCC := .Env.ENABLE_TCC | default "true" | toBool -}}
{{ $ENABLE_TRANSCRIPTIONS := .Env.ENABLE_TRANSCRIPTIONS | default "false" | toBool -}}
{{ $RESOLUTION := .Env.RESOLUTION | default "720" -}}
{{ $RESOLUTION_MIN := .Env.RESOLUTION_MIN | default "180" -}}
{{ $RESOLUTION_WIDTH := .Env.RESOLUTION_WIDTH | default "1280" -}}
{{ $RESOLUTION_WIDTH_MIN := .Env.RESOLUTION_WIDTH_MIN | default "320" -}}
{{ $START_AUDIO_ONLY := .Env.START_AUDIO_ONLY | default "false" | toBool -}}
{{ $START_AUDIO_MUTED := .Env.START_AUDIO_MUTED | default 10 -}}
{{ $START_WITH_AUDIO_MUTED := .Env.START_WITH_AUDIO_MUTED | default "false" | toBool -}}
{{ $START_SILENT := .Env.START_SILENT | default "false" | toBool -}}
{{ $DISABLE_AUDIO_LEVELS := .Env.DISABLE_AUDIO_LEVELS | default "false" | toBool -}}
{{ $ENABLE_NOISY_MIC_DETECTION := .Env.ENABLE_NOISY_MIC_DETECTION | default "true" | toBool -}}
{{ $START_VIDEO_MUTED := .Env.START_VIDEO_MUTED | default 10 -}}
{{ $START_WITH_VIDEO_MUTED := .Env.START_WITH_VIDEO_MUTED | default "false" | toBool -}}
{{ $DESKTOP_SHARING_FRAMERATE_MIN := .Env.DESKTOP_SHARING_FRAMERATE_MIN | default 5 -}}
{{ $DESKTOP_SHARING_FRAMERATE_MAX := .Env.DESKTOP_SHARING_FRAMERATE_MAX | default 5 -}}
{{ $TESTING_OCTO_PROBABILITY := .Env.TESTING_OCTO_PROBABILITY | default "0" -}}
{{ $TESTING_CAP_SCREENSHARE_BITRATE := .Env.TESTING_CAP_SCREENSHARE_BITRATE | default "1" -}}
{{ $XMPP_DOMAIN := .Env.XMPP_DOMAIN -}}
{{ $XMPP_RECORDER_DOMAIN := .Env.XMPP_RECORDER_DOMAIN -}}
{{ $DISABLE_DEEP_LINKING  := .Env.DISABLE_DEEP_LINKING | default "false" | toBool -}}
{{ $VIDEOQUALITY_ENFORCE_PREFERRED_CODEC := .Env.VIDEOQUALITY_ENFORCE_PREFERRED_CODEC | default "false" | toBool -}}
{{ $DISABLE_POLLS := .Env.DISABLE_POLLS | default "false" | toBool -}}
{{ $ENABLE_REACTIONS := .Env.ENABLE_REACTIONS | default "true" | toBool -}}
// Video configuration.
//

if (!config.hasOwnProperty('constraints')) config.constraints = {};
if (!config.constraints.hasOwnProperty('video')) config.constraints.video = {};

config.resolution = {{ $RESOLUTION }};
config.constraints.video.height = { ideal: {{ $RESOLUTION }}, max: {{ $RESOLUTION }}, min: {{ $RESOLUTION_MIN }} };
config.constraints.video.width = { ideal: {{ $RESOLUTION_WIDTH }}, max: {{ $RESOLUTION_WIDTH }}, min: {{ $RESOLUTION_WIDTH_MIN }}};
config.disableSimulcast = {{ not $ENABLE_SIMULCAST }};
config.startVideoMuted = {{ $START_VIDEO_MUTED }};
config.startWithVideoMuted = {{ $START_WITH_VIDEO_MUTED }};

{{ if .Env.START_BITRATE -}}
config.startBitrate = '{{ .Env.START_BITRATE }}';
{{ end -}}
 
// ScreenShare Configuration.
//
config.desktopSharingFrameRate = { min: {{ $DESKTOP_SHARING_FRAMERATE_MIN }}, max: {{ $DESKTOP_SHARING_FRAMERATE_MAX }} };

// Audio configuration.
//

config.enableNoAudioDetection = {{ $ENABLE_NO_AUDIO_DETECTION }};
config.enableTalkWhileMuted = {{ $ENABLE_TALK_WHILE_MUTED }};
config.disableAP = {{ not $ENABLE_AUDIO_PROCESSING }};
config.stereo = {{ $ENABLE_STEREO }};
config.startAudioOnly = {{ $START_AUDIO_ONLY }};
config.startAudioMuted = {{ $START_AUDIO_MUTED }};
config.startWithAudioMuted = {{ $START_WITH_AUDIO_MUTED }};
config.startSilent = {{ $START_SILENT }};
config.disableAudioLevels = {{ $DISABLE_AUDIO_LEVELS }};
config.enableNoisyMicDetection = {{ $ENABLE_NOISY_MIC_DETECTION }};


// Peer-to-Peer options.
//

if (!config.hasOwnProperty('p2p')) config.p2p = {};

config.p2p.enabled = {{ $ENABLE_P2P }};


// Etherpad
//

{{ if .Env.ETHERPAD_PUBLIC_URL -}}
config.etherpad_base = '{{ .Env.ETHERPAD_PUBLIC_URL }}';
{{ else if .Env.ETHERPAD_URL_BASE -}}
config.etherpad_base = '{{.Env.PUBLIC_URL}}/etherpad/p/';
{{ end -}}


// Recording.
//

{{ if $ENABLE_RECORDING -}}

config.hiddenDomain = '{{ $XMPP_RECORDER_DOMAIN }}';

// Whether to enable file recording or not
config.fileRecordingsEnabled = true;

// Whether to enable live streaming or not.
config.liveStreamingEnabled = true;

{{ if .Env.DROPBOX_APPKEY -}}
// Enable the dropbox integration.
if (!config.hasOwnProperty('dropbox')) config.dropbox = {};
config.dropbox.appKey = '{{ .Env.DROPBOX_APPKEY }}';
{{ if .Env.DROPBOX_REDIRECT_URI -}}
// A URL to redirect the user to, after authenticating
// by default uses:
// 'https://jitsi-meet.example.com/static/oauth.html'
config.dropbox.redirectURI = '{{ .Env.DROPBOX_REDIRECT_URI }}';
{{ end -}}
{{ end -}}

{{ if $ENABLE_FILE_RECORDING_SERVICE -}}
// When integrations like dropbox are enabled only that will be shown,
// by enabling fileRecordingsServiceEnabled, we show both the integrations
// and the generic recording service (its configuration and storage type
// depends on jibri configuration)
config.fileRecordingsServiceEnabled = true;
{{ end -}}
{{ if $ENABLE_FILE_RECORDING_SERVICE_SHARING -}}
// Whether to show the possibility to share file recording with other people
// (e.g. meeting participants), based on the actual implementation
// on the backend.
config.fileRecordingsServiceSharingEnabled = true;
{{ end -}}
{{ end -}}


// Analytics.
//

if (!config.hasOwnProperty('analytics')) config.analytics = {};

{{ if .Env.AMPLITUDE_ID -}}
// The Amplitude APP Key:
config.analytics.amplitudeAPPKey = '{{ .Env.AMPLITUDE_ID }}';
{{ end -}}

{{ if .Env.GOOGLE_ANALYTICS_ID -}}
// The Google Analytics Tracking ID:
config.analytics.googleAnalyticsTrackingId = '{{ .Env.GOOGLE_ANALYTICS_ID }}';
{{ end -}}

{{ if .Env.MATOMO_ENDPOINT -}}
// Matomo endpoint:
config.analytics.matomoEndpoint = '{{ .Env.MATOMO_ENDPOINT }}';
{{ end -}}

{{ if .Env.MATOMO_SITE_ID -}}
// Matomo site ID:
config.analytics.matomoSiteID = '{{ .Env.MATOMO_SITE_ID }}';
{{ end -}}

{{ if .Env.ANALYTICS_SCRIPT_URLS -}}
// Array of script URLs to load as lib-jitsi-meet "analytics handlers".
config.analytics.scriptURLs = [ '{{ join "','" (splitList "," .Env.ANALYTICS_SCRIPT_URLS) }}' ];
{{ end -}}

{{ if .Env.ANALYTICS_WHITELISTED_EVENTS -}}
config.analytics.whiteListedEvents = [ '{{ join "','" (splitList "," .Env.ANALYTICS_WHITELISTED_EVENTS) }}' ];
{{ end -}}

{{ if .Env.CALLSTATS_CUSTOM_SCRIPT_URL -}}
config.callStatsCustomScriptUrl = '{{ .Env.CALLSTATS_CUSTOM_SCRIPT_URL }}';
{{ end -}}

{{ if .Env.CALLSTATS_ID -}}
// To enable sending statistics to callstats.io you must provide the
// Application ID and Secret.
config.callStatsID = '{{ .Env.CALLSTATS_ID }}';
{{ end -}}

{{ if .Env.CALLSTATS_ID -}}
config.callStatsSecret = '{{ .Env.CALLSTATS_SECRET }}';
{{ end -}}

// Enables callstatsUsername to be reported as statsId and used
// by callstats as repoted remote id.
config.enableStatsID = {{ $ENABLE_STATS_ID }};


// Dial in/out services.
//

{{ if .Env.CONFCODE_URL -}}
config.dialInConfCodeUrl = '{{ .Env.CONFCODE_URL }}';
{{ end -}}

{{ if .Env.DIALIN_NUMBERS_URL -}}
config.dialInNumbersUrl = '{{ .Env.DIALIN_NUMBERS_URL }}';
{{ end -}}

{{ if .Env.DIALOUT_AUTH_URL -}}
config.dialOutAuthUrl = '{{ .Env.DIALOUT_AUTH_URL }}';
{{ end -}}

{{ if .Env.DIALOUT_CODES_URL -}}
config.dialOutCodesUrl = '{{ .Env.DIALOUT_CODES_URL }}';
{{ end -}}


// Calendar service integration.
//

config.enableCalendarIntegration = {{ $ENABLE_CALENDAR }};

{{ if .Env.GOOGLE_API_APP_CLIENT_ID -}}
config.googleApiApplicationClientID = '{{ .Env.GOOGLE_API_APP_CLIENT_ID }}';
{{ end -}}

{{ if .Env.MICROSOFT_API_APP_CLIENT_ID -}}
config.microsoftApiApplicationClientID = '{{ .Env.MICROSOFT_API_APP_CLIENT_ID }}';
{{ end -}}


// Invitation service.
//

{{ if .Env.INVITE_SERVICE_URL -}}
config.inviteServiceUrl = '{{ .Env.INVITE_SERVICE_URL }}';
{{ end -}}

{{ if .Env.PEOPLE_SEARCH_URL -}}
config.peopleSearchUrl = '{{ .Env.PEOPLE_SEARCH_URL }}';
config.peopleSearchQueryTypes = ['user','conferenceRooms'];
{{ end -}}


// Miscellaneous.
//

// Prejoin page.
config.prejoinPageEnabled = {{ $ENABLE_PREJOIN_PAGE }};

// Welcome page.
config.enableWelcomePage = {{ $ENABLE_WELCOME_PAGE }};

// Close page.
config.enableClosePage = {{ $ENABLE_CLOSE_PAGE }};

// Default language.
{{ if .Env.DEFAULT_LANGUAGE -}}
config.defaultLanguage = '{{ .Env.DEFAULT_LANGUAGE }}';
{{ end -}}

// Require users to always specify a display name.
config.requireDisplayName = {{ $ENABLE_REQUIRE_DISPLAY_NAME }};

// Chrome extension banner.
{{ if .Env.CHROME_EXTENSION_BANNER_JSON -}}
config.chromeExtensionBanner = {{ .Env.CHROME_EXTENSION_BANNER_JSON }};
{{ end -}}


// Advanced.
//

// Lipsync hack in jicofo, may not be safe.
config.enableLipSync = {{ $ENABLE_LIPSYNC }};

config.enableRemb = {{ $ENABLE_REMB }};
config.enableTcc = {{ $ENABLE_TCC }};

// Enable IPv6 support.
config.useIPv6 = {{ $ENABLE_IPV6 }};

// Transcriptions (subtitles and buttons can be configured in interface_config)
config.transcribingEnabled = {{ $ENABLE_TRANSCRIPTIONS }};

{{ if .Env.DYNAMIC_BRANDING_URL -}}
// External API url used to receive branding specific information.
config.dynamicBrandingUrl = '{{ .Env.DYNAMIC_BRANDING_URL }}';
{{ end -}}

{{ if .Env.TOKEN_AUTH_URL -}}
// Authenticate using external service or just focus external auth window if there is one already.
config.tokenAuthUrl = '{{ .Env.TOKEN_AUTH_URL }}';
{{ end -}}


// Deployment information.
//

if (!config.hasOwnProperty('deploymentInfo')) config.deploymentInfo = {};

{{ if .Env.DEPLOYMENTINFO_ENVIRONMENT -}}
config.deploymentInfo.environment = '{{ .Env.DEPLOYMENTINFO_ENVIRONMENT }}';
{{ end -}}

{{ if .Env.DEPLOYMENTINFO_SHARD -}}
config.deploymentInfo.shard = '{{ .Env.DEPLOYMENTINFO_SHARD }}';
{{ end -}}

{{ if .Env.DEPLOYMENTINFO_ENVIRONMENT_TYPE -}}
config.deploymentInfo.envType = '{{ .Env.DEPLOYMENTINFO_ENVIRONMENT_TYPE }}';
{{ end -}}

{{ if .Env.DEPLOYMENTINFO_REGION -}}
config.deploymentInfo.region = '{{ .Env.DEPLOYMENTINFO_REGION }}';
{{ end -}}

{{ if $DEPLOYMENTINFO_USERREGION -}}
config.deploymentInfo.userRegion = '{{ $DEPLOYMENTINFO_USERREGION }}';
{{ end -}}


// Testing
//

if (!config.hasOwnProperty('testing')) config.testing = {};
if (!config.testing.hasOwnProperty('octo')) config.testing.octo = {};

config.testing.capScreenshareBitrate = {{ $TESTING_CAP_SCREENSHARE_BITRATE }};
config.testing.octo.probability = {{ $TESTING_OCTO_PROBABILITY }};

// Deep Linking
config.disableDeepLinking = {{ $DISABLE_DEEP_LINKING }};

// P2P preferred codec
{{ if .Env.P2P_PREFERRED_CODEC -}}
config.p2p.preferredCodec = '{{ .Env.P2P_PREFERRED_CODEC }}';
{{ end -}}

// enable preffered video Codec
if (!config.hasOwnProperty('videoQuality')) config.videoQuality = {};
{{ if .Env.VIDEOQUALITY_PREFERRED_CODEC -}}
config.videoQuality.preferredCodec = '{{ .Env.VIDEOQUALITY_PREFERRED_CODEC }}';
{{ end -}}

config.videoQuality.enforcePreferredCodec = {{ $VIDEOQUALITY_ENFORCE_PREFERRED_CODEC }};

if (!config.videoQuality.hasOwnProperty('maxBitratesVideo')) config.videoQuality.maxBitratesVideo = {};
{{ if and .Env.VIDEOQUALITY_BITRATE_H264_LOW .Env.VIDEOQUALITY_BITRATE_H264_STANDARD .Env.VIDEOQUALITY_BITRATE_H264_HIGH -}}
config.videoQuality.maxBitratesVideo.H264 = { low: {{ .Env.VIDEOQUALITY_BITRATE_H264_LOW }}, standard: {{ .Env.VIDEOQUALITY_BITRATE_H264_STANDARD }}, high: {{ .Env.VIDEOQUALITY_BITRATE_H264_HIGH }} };
{{ end -}}
{{ if and .Env.VIDEOQUALITY_BITRATE_VP8_LOW .Env.VIDEOQUALITY_BITRATE_VP8_STANDARD .Env.VIDEOQUALITY_BITRATE_VP8_HIGH -}}
config.videoQuality.maxBitratesVideo.VP8 = { low: {{ .Env.VIDEOQUALITY_BITRATE_VP8_LOW }}, standard: {{ .Env.VIDEOQUALITY_BITRATE_VP8_STANDARD }}, high: {{ .Env.VIDEOQUALITY_BITRATE_VP8_HIGH }} };
{{ end -}}
{{ if and .Env.VIDEOQUALITY_BITRATE_VP9_LOW .Env.VIDEOQUALITY_BITRATE_VP9_STANDARD .Env.VIDEOQUALITY_BITRATE_VP9_HIGH -}}
config.videoQuality.maxBitratesVideo.VP9 = { low: {{ .Env.VIDEOQUALITY_BITRATE_VP9_LOW }}, standard: {{ .Env.VIDEOQUALITY_BITRATE_VP9_STANDARD }}, high: {{ .Env.VIDEOQUALITY_BITRATE_VP9_HIGH }} };
{{ end -}}

 // Enables reactions feature.
config.enableReactions = {{ $ENABLE_REACTIONS }};

// Polls
config.disablePolls = {{ $DISABLE_POLLS }};
