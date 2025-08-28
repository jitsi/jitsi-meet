import { NativeModules } from 'react-native';

import { IReduxState } from '../../app/types';
import { REPLACE_PARTICIPANT } from '../flags/constants';
import { getFeatureFlag } from '../flags/functions';

import { IConfig, IDeeplinkingConfig } from './configType';

export * from './functions.any';

/**
 * Removes all analytics related options from the given configuration, in case of a libre build.
 *
 * @param {*} config - The configuration which needs to be cleaned up.
 * @returns {void}
 */
export function _cleanupConfig(config: IConfig) {
    config.analytics = config.analytics ?? {};
    config.analytics.scriptURLs = [];

    if (NativeModules.AppInfo.LIBRE_BUILD) {
        delete config.analytics?.amplitudeAPPKey;
        delete config.analytics?.rtcstatsEnabled;
        delete config.analytics?.rtcstatsEndpoint;
        delete config.analytics?.rtcstatsPollInterval;
        delete config.analytics?.rtcstatsSendSdp;
        delete config.analytics?.obfuscateRoomName;
        delete config.analytics?.watchRTCEnabled;
        delete config.watchRTCConfigParams;
        config.giphy = { enabled: false };
    }
}

/**
 * Returns the replaceParticipant config.
 *
 * @param {Object} state - The state of the app.
 * @returns {boolean}
 */
export function getReplaceParticipant(state: IReduxState): string {
    return getFeatureFlag(state, REPLACE_PARTICIPANT, false);
}

/**
 * Sets the defaults for deeplinking.
 *
 * @param {IDeeplinkingConfig} _deeplinking - The deeplinking config.
 * @returns {void}
 */
export function _setDeeplinkingDefaults(_deeplinking: IDeeplinkingConfig) {
    return;
}

