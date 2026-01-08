import { IConfig } from '../base/config/configType';
import { parseURLParams } from '../base/util/parseURLParams';
import { getBackendSafeRoomName } from '../base/util/uri';

/**
 * Checks if the token for authentication is available.
 *
 * @param {Object} config - Configuration state object from store.
 * @returns {boolean}
 */
export const isTokenAuthEnabled = (config: IConfig): boolean =>
    typeof config.tokenAuthUrl === 'string' && config.tokenAuthUrl.length > 0;

/**
 * Returns the state that we can add as a parameter to the tokenAuthUrl.
 *
 * @param {URL} locationURL - The location URL.
 * @param {Object} options: - Config options {
 *     audioMuted: boolean | undefined
 *     audioOnlyEnabled: boolean | undefined,
 *     skipPrejoin: boolean | undefined,
 *     videoMuted: boolean | undefined
 * }.
 * @param {string?} roomName - The room name.
 * @param {string?} tenant - The tenant name if any.
 *
 * @returns {Object} The state object.
 */
export const _getTokenAuthState = (
        locationURL: URL,
        options: {
            audioMuted: boolean | undefined;
            audioOnlyEnabled: boolean | undefined;
            skipPrejoin: boolean | undefined;
            videoMuted: boolean | undefined;
        },
        roomName: string | undefined,
        tenant: string | undefined): object => {
    const state = {
        room: roomName,
        roomSafe: getBackendSafeRoomName(roomName),
        tenant
    };

    const {
        audioMuted = false,
        audioOnlyEnabled = false,
        skipPrejoin = false,
        videoMuted = false
    } = options;

    if (audioMuted) {

        // @ts-ignore
        state['config.startWithAudioMuted'] = true;
    }

    if (audioOnlyEnabled) {

        // @ts-ignore
        state['config.startAudioOnly'] = true;
    }

    if (skipPrejoin) {
        // We have already shown the prejoin screen, no need to show it again after obtaining the token.
        // @ts-ignore
        state['config.prejoinConfig.enabled'] = false;
    }

    if (videoMuted) {

        // @ts-ignore
        state['config.startWithVideoMuted'] = true;
    }
    const params = parseURLParams(locationURL);

    for (const key of Object.keys(params)) {
        // we allow only config, interfaceConfig and iceServers overrides in the state
        if (key.startsWith('config.') || key.startsWith('interfaceConfig.') || key.startsWith('iceServers.')) {
            // @ts-ignore
            state[key] = params[key];
        }
    }

    return state;
};
