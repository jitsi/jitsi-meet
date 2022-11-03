import { IReduxState } from '../app/types';

import { GIF_DEFAULT_RATING, GIF_PREFIX } from './constants';
import { IGif } from './reducer';

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
 * @returns {boolean}
 */
export function getGifUrl(gif?: { data?: { embed_url: string; }; embed_url?: string; }) {
    const embedUrl = gif?.embed_url || gif?.data?.embed_url || '';
    const idx = embedUrl.lastIndexOf('/');
    const id = embedUrl.substr(idx + 1);

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
    return state['features/base/config']?.giphy?.sdkKey ?? '';
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

    if (navigator.product === 'ReactNative' && window.JITSI_MEET_LITE_SDK) {
        return false;
    }

    return Boolean(!disableThirdPartyRequests && giphy?.enabled && Boolean(giphy?.sdkKey));
}

/**
 * Get the GIF display mode.
 *
 * @param {IReduxState} state - Redux state.
 * @returns {string}
 */
export function getGifDisplayMode(state: IReduxState) {
    const { giphy } = state['features/base/config'];

    return giphy?.displayMode || 'all';
}

/**
 * Get the GIF audience rating.
 *
 * @param {IReduxState} state - Redux state.
 * @returns {string}
 */
export function getGifRating(state: IReduxState) {
    const { giphy } = state['features/base/config'];

    return giphy?.rating || GIF_DEFAULT_RATING;
}
