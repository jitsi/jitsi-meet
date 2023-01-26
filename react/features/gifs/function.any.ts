import { IReduxState } from '../app/types';

import { GIF_DEFAULT_RATING, GIF_PREFIX } from './constants';
import { IGif } from './reducer';

/**
 * Returns the gif config.
 *
 * @param {IReduxState} state - Redux state.
 * @returns {Object}
 */
export function getGifConfig(state: IReduxState) {
    return state['features/base/config'].giphy || {};
}

/**
 * Get the GIF display mode.
 *
 * @param {IReduxState} state - Redux state.
 * @returns {string}
 */
export function getGifDisplayMode(state: IReduxState) {
    return getGifConfig(state).displayMode || 'all';
}

/**
 * Get the GIF audience rating.
 *
 * @param {IReduxState} state - Redux state.
 * @returns {string}
 */
export function getGifRating(state: IReduxState) {
    return getGifConfig(state).rating || GIF_DEFAULT_RATING;
}

/**
 * Get the Giphy proxy url.
 *
 * @param {IReduxState} state - Redux state.
 * @returns {string}
 */
export function getGiphyProxyUrl(state: IReduxState) {
    return getGifConfig(state).proxyUrl;
}

/**
 * Gets the URL of the GIF for the given participant or null if there's none.
 *
 * @param {IReduxState} state - Redux state.
 * @param {string} participantId - Id of the participant for which to remove the GIF.
 * @returns {Object}
 */
export function getGifForParticipant(state: IReduxState, participantId: string): IGif {
    return isGifEnabled(state) ? state['features/gifs'].gifList.get(participantId) || {} : {};
}

/**
 * Whether or not the message is a GIF message.
 *
 * @param {string} message - Message to check.
 * @returns {boolean}
 */
export function isGifMessage(message: string) {
    return message.trim().toLowerCase()
        .startsWith(GIF_PREFIX);
}

/**
 * Returns the url of the gif selected in the gifs menu.
 *
 * @param {Object} gif - The gif data.
 * @param {string} proxyUrl - The proxy server url.
 * @returns {boolean}
 */
export function getGifUrl(gif?: { data?: { embed_url: string; }; embed_url?: string; }, proxyUrl?: string) {
    const embedUrl = gif?.embed_url || gif?.data?.embed_url || '';
    const idx = embedUrl.lastIndexOf('/');
    const id = embedUrl.substr(idx + 1);

    if (proxyUrl) {
        return `${proxyUrl}gifs/id/${id}`;
    }

    return `https://i.giphy.com/media/${id}/giphy.gif`;
}

/**
 * Formats the gif message.
 *
 * @param {string} url - GIF url.
 * @returns {string}
 */
export function formatGifUrlMessage(url: string) {
    return `${GIF_PREFIX}${url}]`;
}

/**
 * Get the Giphy API Key from config.
 *
 * @param {IReduxState} state - Redux state.
 * @returns {string}
 */
export function getGifAPIKey(state: IReduxState) {
    return getGifConfig(state).sdkKey ?? '';
}

/**
 * Returns whether or not the feature is enabled.
 *
 * @param {IReduxState} state - Redux state.
 * @returns {boolean}
 */
export function isGifEnabled(state: IReduxState) {
    const { disableThirdPartyRequests } = state['features/base/config'];
    const { giphy } = state['features/base/config'];
    const showGiphyIntegration = state['features/dynamic-branding']?.showGiphyIntegration !== false;

    if (navigator.product === 'ReactNative' && window.JITSI_MEET_LITE_SDK) {
        return false;
    }

    return showGiphyIntegration && Boolean(!disableThirdPartyRequests && giphy?.enabled && Boolean(giphy?.sdkKey));
}

