import { IConfig } from '../base/config/configType';
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
 * @param {boolean} audioOnlyEnabled - Join conference audio only.
 * @param {string?} roomName - The room name.
 * @param {string?} tenant - The tenant name if any.
 * @param {boolean} skipPrejoin - Whether to skip pre-join page.
 * @param {URL} locationURL - The location URL.
 * @returns {Object} The state object.
 */
export const _getTokenAuthState = (
        audioOnlyEnabled: boolean | undefined = false,
        roomName: string | undefined,
        tenant: string | undefined,
        skipPrejoin: boolean | undefined = false,
        // eslint-disable-next-line max-params
        locationURL: URL): object => {
    const state = {
        room: roomName,
        roomSafe: getBackendSafeRoomName(roomName),
        tenant
    };

    if (skipPrejoin) {
        // We have already shown the prejoin screen, no need to show it again after obtaining the token.
        // @ts-ignore
        state['config.prejoinConfig.enabled'] = false;
    }

    if (audioOnlyEnabled) {

        // @ts-ignore
        state['config.startAudioOnly'] = true;
    }

    const params = new URLSearchParams(locationURL.hash);

    for (const [ key, value ] of params) {
        // we allow only config and interfaceConfig overrides in the state
        if (key.startsWith('config.') || key.startsWith('interfaceConfig.')) {
            // @ts-ignore
            state[key] = value;
        }
    }

    return state;
};
