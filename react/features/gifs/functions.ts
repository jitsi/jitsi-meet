import { IState } from '../app/types';
import { showOverflowDrawer } from '../toolbox/functions.web';

import { GIF_PREFIX } from './constants';
import { IGif } from './reducer';

/**
 * Gets the URL of the GIF for the given participant or null if there's none.
 *
 * @param {IState} state - Redux state.
 * @param {string} participantId - Id of the participant for which to remove the GIF.
 * @returns {Object}
 */
export function getGifForParticipant(state: IState, participantId: string): IGif {
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
 * Returns the visibility state of the gifs menu.
 *
 * @param {IState} state - The state of the application.
 * @returns {boolean}
 */
export function isGifsMenuOpen(state: IState) {
    const overflowDrawer = showOverflowDrawer(state);
    const { drawerVisible, menuOpen } = state['features/gifs'];

    return overflowDrawer ? drawerVisible : menuOpen;
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
 * @param {IState} state - Redux state.
 * @returns {string}
 */
export function getGifAPIKey(state: IState) {
    return state['features/base/config']?.giphy?.sdkKey ?? '';
}

/**
 * Returns whether or not the feature is enabled.
 *
 * @param {IState} state - Redux state.
 * @returns {boolean}
 */
export function isGifEnabled(state: IState) {
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
 * @param {IState} state - Redux state.
 * @returns {string}
 */
export function getGifDisplayMode(state: IState) {
    const { giphy } = state['features/base/config'];

    return giphy?.displayMode || 'all';
}
