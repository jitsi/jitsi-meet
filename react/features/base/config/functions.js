/* @flow */

import JSSHA from 'jssha';
import _ from 'lodash';

import parseURLParams from './parseURLParams';

declare var $: Object;

/**
 * The config keys to ignore because, for example, their values identify scripts
 * and it is not desireable to inject these through URL params.
 *
 * @private
 * @type Array
 */
const _KEYS_TO_IGNORE = [
    'analyticsScriptUrls',
    'callStatsCustomScriptUrl'
];

const logger = require('jitsi-meet-logger').getLogger(__filename);

// XXX The functions getRoomName and parseURLParams are split out of
// functions.js because they are bundled in both app.bundle and
// do_external_connect, webpack 1 does not support tree shaking, and we don't
// want all functions to be bundled in do_external_connect.
export { default as getRoomName } from './getRoomName';
export { parseURLParams };

/* eslint-disable no-shadow */

/**
 * Looks for a list of possible BOSH addresses in {@code config.boshList} and
 * sets the value of {@code config.bosh} based on that list and
 * {@code roomName}.
 *
 * @param {Object} config - The configuration object.
 * @param {string} roomName - The name of the room/conference.
 * @returns {void}
 */
export function chooseBOSHAddress(config: Object, roomName: string) {
    if (!roomName) {
        return;
    }

    const { boshList } = config;

    if (!boshList || !Array.isArray(boshList) || !boshList.length) {
        return;
    }

    // This implements the actual choice of an entry in the list based on
    // roomName. Please consider the implications for existing deployments
    // before introducing changes.
    const hash = (new JSSHA(roomName, 'TEXT')).getHash('SHA-1', 'HEX');
    const n = parseInt(hash.substr(-6), 16);
    let idx = n % boshList.length;

    config.bosh = boshList[idx];
    logger.log(`Setting config.bosh to ${config.bosh} (idx=${idx})`);

    const { boshAttemptFirstList } = config;

    if (boshAttemptFirstList
            && Array.isArray(boshAttemptFirstList)
            && boshAttemptFirstList.length > 0) {
        idx = n % boshAttemptFirstList.length;

        const attemptFirstAddress = boshAttemptFirstList[idx];

        if (attemptFirstAddress === config.bosh) {
            logger.log('Not setting config.boshAttemptFirst, address matches.');
        } else {
            config.boshAttemptFirst = attemptFirstAddress;
            logger.log(
                `Setting config.boshAttemptFirst=${attemptFirstAddress} (idx=${
                    idx})`);
        }
    }
}

/* eslint-enable no-shadow */

/**
 * Sends HTTP POST request to specified <tt>endpoint</tt>. In request the name
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
            const configJSON = json[configName];

            if (!_.isEmpty(configJSON)) {
                logger.info(
                    `Extending ${configName} `
                    + `with: ${JSON.stringify(configJSON)}`);
                _.merge(configObj, configJSON);
            }
        }
    }
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

        // Prevent passing some parameters which can inject scripts.
        if (_KEYS_TO_IGNORE.indexOf(last) !== -1) {
            // eslint-disable-next-line no-continue
            continue;
        }

        for (const name of names) {
            base = base[name] = base[name] || {};
        }

        base[last] = params[param];
    }

    overrideConfigJSON(config, interfaceConfig, loggingConfig, json);
}
