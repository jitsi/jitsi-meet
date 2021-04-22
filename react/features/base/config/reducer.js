// @flow

import _ from 'lodash';

import { equals, ReducerRegistry } from '../redux';

import {
    UPDATE_CONFIG,
    CONFIG_WILL_LOAD,
    LOAD_CONFIG_ERROR,
    SET_CONFIG,
    OVERWRITE_CONFIG
} from './actionTypes';
import { _cleanupConfig } from './functions';

declare var interfaceConfig: Object;

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
const INITIAL_NON_RN_STATE = {
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
const INITIAL_RN_STATE = {
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

ReducerRegistry.register('features/base/config', (state = _getInitialState(), action) => {
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
 * @param {Object} state - The Redux state of the feature base/config.
 * @param {Action} action - The Redux action SET_CONFIG to reduce.
 * @private
 * @returns {Object} The new state after the reduction of the specified action.
 */
function _setConfig(state, { config }) {
    // The mobile app bundles jitsi-meet and lib-jitsi-meet at build time and
    // does not download them at runtime from the deployment on which it will
    // join a conference. The downloading is planned for implementation in the
    // future (later rather than sooner) but is not implemented yet at the time
    // of this writing and, consequently, we must provide legacy support in the
    // meantime.

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
function _translateLegacyConfig(oldValue: Object) {
    const newValue = oldValue;

    if (!Array.isArray(oldValue.toolbarButtons)
            && typeof interfaceConfig === 'object' && Array.isArray(interfaceConfig.TOOLBAR_BUTTONS)) {
        newValue.toolbarButtons = interfaceConfig.TOOLBAR_BUTTONS;
    }

    if (oldValue.stereo || oldValue.opusMaxAverageBitrate) {
        newValue.audioQuality = {
            opusMaxAverageBitrate: oldValue.audioQuality?.opusMaxAverageBitrate ?? oldValue.opusMaxAverageBitrate,
            stereo: oldValue.audioQuality?.stereo ?? oldValue.stereo
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
function _updateConfig(state, { config }) {
    const newState = _.merge({}, state, config);

    _cleanupConfig(newState);

    return equals(state, newState) ? state : newState;
}
