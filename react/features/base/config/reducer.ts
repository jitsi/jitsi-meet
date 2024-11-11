import _ from 'lodash';

import { CONFERENCE_INFO } from '../../conference/components/constants';
import ReducerRegistry from '../redux/ReducerRegistry';
import { equals } from '../redux/functions';

import {
    CONFIG_WILL_LOAD,
    LOAD_CONFIG_ERROR,
    OVERWRITE_CONFIG,
    SET_CONFIG,
    UPDATE_CONFIG
} from './actionTypes';
import { IConfig } from './configType';
// eslint-disable-next-line lines-around-comment
// @ts-ignore
import { _cleanupConfig } from './functions';

declare let interfaceConfig: any;

/**
 * The initial state of the feature base/config when executing in a
 * non-React Native environment. The mandatory configuration to be passed to
 * JitsiMeetJS#init(). The app will download config.js from the Jitsi Meet
 * deployment and take its values into account but the values below will be
 * enforced (because they are essential to the correct execution of the
 * application).
 *
 * @type {Object}
 */
const INITIAL_NON_RN_STATE: IConfig = {
};

/**
 * The initial state of the feature base/config when executing in a React Native
 * environment. The mandatory configuration to be passed to JitsiMeetJS#init().
 * The app will download config.js from the Jitsi Meet deployment and take its
 * values into account but the values below will be enforced (because they are
 * essential to the correct execution of the application).
 *
 * @type {Object}
 */
const INITIAL_RN_STATE: IConfig = {
    analytics: {},

    // FIXME The support for audio levels in lib-jitsi-meet polls the statistics
    // of WebRTC at a short interval multiple times a second. Unfortunately,
    // React Native is slow to fetch these statistics from the native WebRTC
    // API, through the React Native bridge and eventually to JavaScript.
    // Because the audio levels are of no interest to the mobile app, it is
    // fastest to merely disable them.
    disableAudioLevels: true,

    p2p: {
        disabledCodec: '',
        disableH264: false, // deprecated
        preferredCodec: 'H264',
        preferH264: true // deprecated
    }
};

/**
 * Mapping between old configs controlling the conference info headers visibility and the
 * new configs. Needed in order to keep backwards compatibility.
 */
const CONFERENCE_HEADER_MAPPING: any = {
    hideConferenceTimer: [ 'conference-timer' ],
    hideConferenceSubject: [ 'subject' ],
    hideParticipantsStats: [ 'participants-count' ],
    hideRecordingLabel: [ 'recording' ]
};

export interface IConfigState extends IConfig {
    analysis?: {
        obfuscateRoomName?: boolean;
    };
    error?: Error;
}

ReducerRegistry.register<IConfigState>('features/base/config', (state = _getInitialState(), action): IConfigState => {
    switch (action.type) {
    case UPDATE_CONFIG:
        return _updateConfig(state, action);

    case CONFIG_WILL_LOAD:
        return {
            error: undefined,

            /**
            * The URL of the location associated with/configured by this
            * configuration.
            *
            * @type URL
            */
            locationURL: action.locationURL
        };

    case LOAD_CONFIG_ERROR:
        // XXX LOAD_CONFIG_ERROR is one of the settlement execution paths of
        // the asynchronous "loadConfig procedure/process" started with
        // CONFIG_WILL_LOAD. Due to the asynchronous nature of it, whoever
        // is settling the process needs to provide proof that they have
        // started it and that the iteration of the process being completed
        // now is still of interest to the app.
        if (state.locationURL === action.locationURL) {
            return {
                /**
                * The {@link Error} which prevented the loading of the
                * configuration of the associated {@code locationURL}.
                *
                * @type Error
                */
                error: action.error
            };
        }
        break;

    case SET_CONFIG:
        return _setConfig(state, action);

    case OVERWRITE_CONFIG:
        return {
            ...state,
            ...action.config
        };
    }

    return state;
});

/**
 * Gets the initial state of the feature base/config. The mandatory
 * configuration to be passed to JitsiMeetJS#init(). The app will download
 * config.js from the Jitsi Meet deployment and take its values into account but
 * the values below will be enforced (because they are essential to the correct
 * execution of the application).
 *
 * @returns {Object}
 */
function _getInitialState() {
    return (
        navigator.product === 'ReactNative'
            ? INITIAL_RN_STATE
            : INITIAL_NON_RN_STATE);
}

/**
 * Reduces a specific Redux action SET_CONFIG of the feature
 * base/lib-jitsi-meet.
 *
 * @param {IConfig} state - The Redux state of the feature base/config.
 * @param {Action} action - The Redux action SET_CONFIG to reduce.
 * @private
 * @returns {Object} The new state after the reduction of the specified action.
 */
function _setConfig(state: IConfig, { config }: { config: IConfig; }) {
    // eslint-disable-next-line no-param-reassign
    config = _translateLegacyConfig(config);

    const { audioQuality } = config;
    const hdAudioOptions = {};

    if (audioQuality?.stereo) {
        Object.assign(hdAudioOptions, {
            disableAP: true,
            enableNoAudioDetection: false,
            enableNoisyMicDetection: false,
            enableTalkWhileMuted: false
        });
    }

    const newState = _.merge(
        {},
        config,
        hdAudioOptions,
        { error: undefined },

        // The config of _getInitialState() is meant to override the config
        // downloaded from the Jitsi Meet deployment because the former contains
        // values that are mandatory.
        _getInitialState()
    );

    _cleanupConfig(newState);

    return equals(state, newState) ? state : newState;
}

/**
 * Processes the conferenceInfo object against the defaults.
 *
 * @param {IConfig} config - The old config.
 * @returns {Object} The processed conferenceInfo object.
 */
function _getConferenceInfo(config: IConfig) {
    const { conferenceInfo } = config;

    if (conferenceInfo) {
        return {
            alwaysVisible: conferenceInfo.alwaysVisible ?? [ ...CONFERENCE_INFO.alwaysVisible ],
            autoHide: conferenceInfo.autoHide ?? [ ...CONFERENCE_INFO.autoHide ]
        };
    }

    return {
        ...CONFERENCE_INFO
    };
}

/**
 * Constructs a new config {@code Object}, if necessary, out of a specific
 * interface_config {@code Object} which is in the latest format supported by jitsi-meet.
 *
 * @param {Object} oldValue - The config {@code Object} which may or may not be
 * in the latest form supported by jitsi-meet and from which a new config
 * {@code Object} is to be constructed if necessary.
 * @returns {Object} A config {@code Object} which is in the latest format
 * supported by jitsi-meet.
 */
function _translateInterfaceConfig(oldValue: IConfig) {
    const newValue = oldValue;

    if (!Array.isArray(oldValue.toolbarButtons)
        && typeof interfaceConfig === 'object' && Array.isArray(interfaceConfig.TOOLBAR_BUTTONS)) {
        newValue.toolbarButtons = interfaceConfig.TOOLBAR_BUTTONS;
    }

    if (!oldValue.toolbarConfig) {
        oldValue.toolbarConfig = {};
    }

    newValue.toolbarConfig = oldValue.toolbarConfig || {};
    if (typeof oldValue.toolbarConfig.alwaysVisible !== 'boolean'
        && typeof interfaceConfig === 'object'
        && typeof interfaceConfig.TOOLBAR_ALWAYS_VISIBLE === 'boolean') {
        newValue.toolbarConfig.alwaysVisible = interfaceConfig.TOOLBAR_ALWAYS_VISIBLE;
    }

    if (typeof oldValue.toolbarConfig.initialTimeout !== 'number'
        && typeof interfaceConfig === 'object'
        && typeof interfaceConfig.INITIAL_TOOLBAR_TIMEOUT === 'number') {
        newValue.toolbarConfig.initialTimeout = interfaceConfig.INITIAL_TOOLBAR_TIMEOUT;
    }

    if (typeof oldValue.toolbarConfig.timeout !== 'number'
        && typeof interfaceConfig === 'object'
        && typeof interfaceConfig.TOOLBAR_TIMEOUT === 'number') {
        newValue.toolbarConfig.timeout = interfaceConfig.TOOLBAR_TIMEOUT;
    }

    if (!oldValue.connectionIndicators
        && typeof interfaceConfig === 'object'
        && (interfaceConfig.hasOwnProperty('CONNECTION_INDICATOR_DISABLED')
            || interfaceConfig.hasOwnProperty('CONNECTION_INDICATOR_AUTO_HIDE_ENABLED')
            || interfaceConfig.hasOwnProperty('CONNECTION_INDICATOR_AUTO_HIDE_TIMEOUT'))) {
        newValue.connectionIndicators = {
            disabled: interfaceConfig.CONNECTION_INDICATOR_DISABLED,
            autoHide: interfaceConfig.CONNECTION_INDICATOR_AUTO_HIDE_ENABLED,
            autoHideTimeout: interfaceConfig.CONNECTION_INDICATOR_AUTO_HIDE_TIMEOUT
        };
    }

    if (oldValue.disableModeratorIndicator === undefined
        && typeof interfaceConfig === 'object'
        && interfaceConfig.hasOwnProperty('DISABLE_FOCUS_INDICATOR')) {
        newValue.disableModeratorIndicator = interfaceConfig.DISABLE_FOCUS_INDICATOR;
    }

    if (oldValue.defaultLocalDisplayName === undefined
        && typeof interfaceConfig === 'object'
        && interfaceConfig.hasOwnProperty('DEFAULT_LOCAL_DISPLAY_NAME')) {
        newValue.defaultLocalDisplayName = interfaceConfig.DEFAULT_LOCAL_DISPLAY_NAME;
    }

    if (oldValue.defaultRemoteDisplayName === undefined
        && typeof interfaceConfig === 'object'
        && interfaceConfig.hasOwnProperty('DEFAULT_REMOTE_DISPLAY_NAME')) {
        newValue.defaultRemoteDisplayName = interfaceConfig.DEFAULT_REMOTE_DISPLAY_NAME;
    }

    if (oldValue.defaultLogoUrl === undefined) {
        if (typeof interfaceConfig === 'object'
            && interfaceConfig.hasOwnProperty('DEFAULT_LOGO_URL')) {
            newValue.defaultLogoUrl = interfaceConfig.DEFAULT_LOGO_URL;
        } else {
            newValue.defaultLogoUrl = 'images/watermark.svg';
        }
    }

    return newValue;
}

/**
 * Constructs a new config {@code Object}, if necessary, out of a specific
 * config {@code Object} which is in the latest format supported by jitsi-meet.
 * Such a translation from an old config format to a new/the latest config
 * format is necessary because the mobile app bundles jitsi-meet and
 * lib-jitsi-meet at build time and does not download them at runtime from the
 * deployment on which it will join a conference.
 *
 * @param {Object} oldValue - The config {@code Object} which may or may not be
 * in the latest form supported by jitsi-meet and from which a new config
 * {@code Object} is to be constructed if necessary.
 * @returns {Object} A config {@code Object} which is in the latest format
 * supported by jitsi-meet.
 */
function _translateLegacyConfig(oldValue: IConfig) {
    const newValue = _translateInterfaceConfig(oldValue);

    // Translate deprecated config values to new config values.

    const filteredConferenceInfo = Object.keys(CONFERENCE_HEADER_MAPPING).filter(key => oldValue[key as keyof IConfig]);

    if (filteredConferenceInfo.length) {
        newValue.conferenceInfo = _getConferenceInfo(oldValue);

        filteredConferenceInfo.forEach(key => {
            newValue.conferenceInfo = oldValue.conferenceInfo ?? {};

            // hideRecordingLabel does not mean not render it at all, but autoHide it
            if (key === 'hideRecordingLabel') {
                newValue.conferenceInfo.alwaysVisible
                    = (newValue.conferenceInfo?.alwaysVisible ?? [])
                    .filter(c => !CONFERENCE_HEADER_MAPPING[key].includes(c));
                newValue.conferenceInfo.autoHide
                    = _.union(newValue.conferenceInfo.autoHide, CONFERENCE_HEADER_MAPPING[key]);
            } else {
                newValue.conferenceInfo.alwaysVisible
                    = (newValue.conferenceInfo.alwaysVisible ?? [])
                    .filter(c => !CONFERENCE_HEADER_MAPPING[key].includes(c));
                newValue.conferenceInfo.autoHide
                    = (newValue.conferenceInfo.autoHide ?? []).filter(c => !CONFERENCE_HEADER_MAPPING[key].includes(c));
            }
        });
    }

    newValue.prejoinConfig = oldValue.prejoinConfig || {};
    if (oldValue.hasOwnProperty('prejoinPageEnabled')
        && !newValue.prejoinConfig.hasOwnProperty('enabled')
    ) {
        newValue.prejoinConfig.enabled = oldValue.prejoinPageEnabled;
    }

    newValue.disabledSounds = newValue.disabledSounds || [];

    if (oldValue.disableJoinLeaveSounds) {
        newValue.disabledSounds.unshift('PARTICIPANT_LEFT_SOUND', 'PARTICIPANT_JOINED_SOUND');
    }

    if (oldValue.disableRecordAudioNotification) {
        newValue.disabledSounds.unshift(
            'RECORDING_ON_SOUND',
            'RECORDING_OFF_SOUND',
            'LIVE_STREAMING_ON_SOUND',
            'LIVE_STREAMING_OFF_SOUND'
        );
    }

    if (oldValue.disableIncomingMessageSound) {
        newValue.disabledSounds.unshift('INCOMING_MSG_SOUND');
    }

    if (oldValue.stereo || oldValue.opusMaxAverageBitrate) {
        newValue.audioQuality = {
            opusMaxAverageBitrate: oldValue.audioQuality?.opusMaxAverageBitrate ?? oldValue.opusMaxAverageBitrate,
            stereo: oldValue.audioQuality?.stereo ?? oldValue.stereo
        };
    }

    newValue.e2ee = newValue.e2ee || {};

    if (oldValue.e2eeLabels) {
        newValue.e2ee.e2eeLabels = oldValue.e2eeLabels;
    }

    newValue.defaultLocalDisplayName
        = newValue.defaultLocalDisplayName || 'me';

    if (oldValue.hideAddRoomButton) {
        newValue.breakoutRooms = {
            /* eslint-disable-next-line no-extra-parens */
            ...(newValue.breakoutRooms || {}),
            hideAddRoomButton: oldValue.hideAddRoomButton
        };
    }

    newValue.defaultRemoteDisplayName
        = newValue.defaultRemoteDisplayName || 'Fellow Jitster';

    newValue.transcription = newValue.transcription || {};
    if (oldValue.transcribingEnabled !== undefined) {
        newValue.transcription = {
            ...newValue.transcription,
            enabled: oldValue.transcribingEnabled
        };
    }
    if (oldValue.transcribeWithAppLanguage !== undefined) {
        newValue.transcription = {
            ...newValue.transcription,
            useAppLanguage: oldValue.transcribeWithAppLanguage
        };
    }
    if (oldValue.preferredTranscribeLanguage !== undefined) {
        newValue.transcription = {
            ...newValue.transcription,
            preferredLanguage: oldValue.preferredTranscribeLanguage
        };
    }
    if (oldValue.autoCaptionOnRecord !== undefined) {
        newValue.transcription = {
            ...newValue.transcription,
            autoCaptionOnRecord: oldValue.autoCaptionOnRecord
        };
    }

    newValue.recordingService = newValue.recordingService || {};
    if (oldValue.fileRecordingsServiceEnabled !== undefined
        && newValue.recordingService.enabled === undefined) {
        newValue.recordingService = {
            ...newValue.recordingService,
            enabled: oldValue.fileRecordingsServiceEnabled
        };
    }
    if (oldValue.fileRecordingsServiceSharingEnabled !== undefined
        && newValue.recordingService.sharingEnabled === undefined) {
        newValue.recordingService = {
            ...newValue.recordingService,
            sharingEnabled: oldValue.fileRecordingsServiceSharingEnabled
        };
    }

    newValue.liveStreaming = newValue.liveStreaming || {};

    // Migrate config.liveStreamingEnabled
    if (oldValue.liveStreamingEnabled !== undefined) {
        newValue.liveStreaming = {
            ...newValue.liveStreaming,
            enabled: oldValue.liveStreamingEnabled
        };
    }

    // Migrate interfaceConfig.LIVE_STREAMING_HELP_LINK
    if (oldValue.liveStreaming === undefined
        && typeof interfaceConfig === 'object'
        && interfaceConfig.hasOwnProperty('LIVE_STREAMING_HELP_LINK')) {
        newValue.liveStreaming = {
            ...newValue.liveStreaming,
            helpLink: interfaceConfig.LIVE_STREAMING_HELP_LINK
        };
    }

    return newValue;
}

/**
 * Updates the stored configuration with the given extra options.
 *
 * @param {Object} state - The Redux state of the feature base/config.
 * @param {Action} action - The Redux action to reduce.
 * @private
 * @returns {Object} The new state after the reduction of the specified action.
 */
function _updateConfig(state: IConfig, { config }: { config: IConfig; }) {
    const newState = _.merge({}, state, config);

    _cleanupConfig(newState);

    return equals(state, newState) ? state : newState;
}
