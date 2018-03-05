/* @flow */

import _ from 'lodash';

import parseURLParams from './parseURLParams';

declare var $: Object;

/**
 * The config keys to whitelist, the keys that can be overridden.
 * Currently we can only whitelist the first part of the properties, like
 * 'p2p.useStunTurn' and 'p2p.enabled' we whitelist all p2p options.
 * The whitelist is used only for config.js.
 *
 * @private
 * @type Array
 */
const WHITELISTED_KEYS = [
    '_peerConnStatusOutOfLastNTimeout',
    '_peerConnStatusRtcMuteTimeout',
    'abTesting',
    'alwaysVisibleToolbar',
    'autoEnableDesktopSharing',
    'autoRecord',
    'autoRecordToken',
    'avgRtpStatsN',
    'callStatsConfIDNamespace',
    'callStatsID',
    'callStatsSecret',
    'channelLastN',
    'constraints',
    'debug',
    'debugAudioLevels',
    'defaultLanguage',
    'desktopSharingChromeDisabled',
    'desktopSharingChromeExtId',
    'desktopSharingChromeMinExtVersion',
    'desktopSharingChromeSources',
    'desktopSharingFrameRate',
    'desktopSharingFirefoxDisabled',
    'desktopSharingSources',
    'disable1On1Mode',
    'disableAEC',
    'disableAGC',
    'disableAP',
    'disableAudioLevels',
    'disableDesktopSharing',
    'disableDesktopSharing',
    'disableH264',
    'disableHPF',
    'disableNS',
    'disableRemoteControl',
    'disableRtx',
    'disableSuspendVideo',
    'displayJids',
    'enableDisplayNameInStats',
    'enableLipSync',
    'enableLocalVideoFlip',
    'enableRecording',
    'enableStatsID',
    'enableTalkWhileMuted',
    'enableUserRolesBasedOnToken',
    'etherpad_base',
    'failICE',
    'firefox_fake_device',
    'forceJVB121Ratio',
    'gatherStats',
    'hiddenDomain',
    'hosts',
    'iAmRecorder',
    'iAmSipGateway',
    'iceTransportPolicy',
    'ignoreStartMuted',
    'nick',
    'openBridgeChannel',
    'p2p',
    'preferH264',
    'recordingType',
    'requireDisplayName',
    'resolution',
    'startAudioMuted',
    'startAudioOnly',
    'startBitrate',
    'startScreenSharing',
    'startVideoMuted',
    'startWithAudioMuted',
    'startWithVideoMuted',
    'testing',
    'useIPv6',
    'useNicks',
    'useStunTurn',
    'webrtcIceTcpDisable',
    'webrtcIceUdpDisable'
];

const logger = require('jitsi-meet-logger').getLogger(__filename);

// XXX The functions getRoomName and parseURLParams are split out of
// functions.js because they are bundled in both app.bundle and
// do_external_connect, webpack 1 does not support tree shaking, and we don't
// want all functions to be bundled in do_external_connect.
export { default as getRoomName } from './getRoomName';
export { parseURLParams };

/**
 * Sends HTTP POST request to specified {@code endpoint}. In request the name
 * of the room is included in JSON format:
 * {
 *     "rooomName": "someroom12345"
 * }.
 *
 * @param {string} endpoint - The name of HTTP endpoint to which to send
 * the HTTP POST request.
 * @param {string} roomName - The name of the conference room for which config
 * is requested.
 * @param {Function} complete - The callback to invoke upon success or failure.
 * @returns {void}
 */
export function obtainConfig(
        endpoint: string,
        roomName: string,
        complete: Function) {
    logger.info(`Send config request to ${endpoint} for room: ${roomName}`);
    $.ajax(
        endpoint,
        {
            contentType: 'application/json',
            data: JSON.stringify({ roomName }),
            dataType: 'json',
            method: 'POST',

            error(jqXHR, textStatus, errorThrown) {
                logger.error('Get config error: ', jqXHR, errorThrown);
                complete(false, `Get config response status: ${textStatus}`);
            },
            success(data) {
                const { config, interfaceConfig, loggingConfig } = window;

                try {
                    overrideConfigJSON(
                        config, interfaceConfig, loggingConfig,
                        data);
                    complete(true);
                } catch (e) {
                    logger.error('Parse config error: ', e);
                    complete(false, e);
                }
            }
        }
    );
}

/* eslint-disable max-params, no-shadow */

/**
 * Overrides JSON properties in {@code config} and
 * {@code interfaceConfig} Objects with the values from {@code newConfig}.
 * Overrides only the whitelisted keys.
 *
 * @param {Object} config - The config Object in which we'll be overriding
 * properties.
 * @param {Object} interfaceConfig - The interfaceConfig Object in which we'll
 * be overriding properties.
 * @param {Object} loggingConfig - The loggingConfig Object in which we'll be
 * overriding properties.
 * @param {Object} json - Object containing configuration properties.
 * Destination object is selected based on root property name:
 * {
 *     config: {
 *         // config.js properties here
 *     },
 *     interfaceConfig: {
 *         // interface_config.js properties here
 *     },
 *     loggingConfig: {
 *         // logging_config.js properties here
 *     }
 * }.
 * @returns {void}
 */
export function overrideConfigJSON(
        config: Object, interfaceConfig: Object, loggingConfig: Object,
        json: Object) {
    for (const configName of Object.keys(json)) {
        let configObj;

        if (configName === 'config') {
            configObj = config;
        } else if (configName === 'interfaceConfig') {
            configObj = interfaceConfig;
        } else if (configName === 'loggingConfig') {
            configObj = loggingConfig;
        }
        if (configObj) {
            const configJSON
                = _getWhitelistedJSON(configName, json[configName]);

            if (!_.isEmpty(configJSON)) {
                logger.info(
                    `Extending ${configName} with: ${
                        JSON.stringify(configJSON)}`);

                // eslint-disable-next-line arrow-body-style
                _.mergeWith(configObj, configJSON, (oldValue, newValue) => {

                    // XXX We don't want to merge the arrays, we want to
                    // overwrite them.
                    return Array.isArray(oldValue) ? newValue : undefined;
                });
            }
        }
    }
}

/**
 * Whitelist only config.js, skips this for others configs
 * (interfaceConfig, loggingConfig).
 * Only extracts overridden values for keys we allow to be overridden.
 *
 * @param {string} configName - The config name, one of config,
 * interfaceConfig, loggingConfig.
 * @param {Object} configJSON - The object with keys and values to override.
 * @returns {Object} - The result object only with the keys
 * that are whitelisted.
 * @private
 */
function _getWhitelistedJSON(configName, configJSON) {
    if (configName !== 'config') {
        return configJSON;
    }

    return _.pick(configJSON, WHITELISTED_KEYS);
}

/* eslint-enable max-params, no-shadow */

/**
 * Converts 'URL_PARAMS' to JSON object.
 * We have:
 * {
 *      "config.disableAudioLevels": false,
 *      "config.channelLastN": -1,
 *      "interfaceConfig.APP_NAME": "Jitsi Meet"
 * }.
 * We want to have:
 * {
 *      "config": {
 *          "disableAudioLevels": false,
 *          "channelLastN": -1
 *      },
 *      interfaceConfig: {
 *          "APP_NAME": "Jitsi Meet"
 *      }
 * }.
 *
 * @returns {void}
 */
export function setConfigFromURLParams() {
    const params = parseURLParams(window.location);

    const { config, interfaceConfig, loggingConfig } = window;
    const json = {};

    // TODO We're still in the middle ground between old Web with config,
    // interfaceConfig, and loggingConfig used via global variables and new Web
    // and mobile reading the respective values from the redux store. On React
    // Native there's no interfaceConfig at all yet and loggingConfig is not
    // loaded but there's a default value in the redux store.
    config && (json.config = {});
    interfaceConfig && (json.interfaceConfig = {});
    loggingConfig && (json.loggingConfig = {});

    for (const param of Object.keys(params)) {
        let base = json;
        const names = param.split('.');
        const last = names.pop();

        for (const name of names) {
            base = base[name] = base[name] || {};
        }

        base[last] = params[param];
    }

    overrideConfigJSON(config, interfaceConfig, loggingConfig, json);
}
