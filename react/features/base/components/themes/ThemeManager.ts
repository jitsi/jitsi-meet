import { IStore } from '../../../app/types';
import {
    setDynamicBrandingFailed,
    setSelectedTheme
} from '../../../dynamic-branding/actions.any';
import logger from '../../../dynamic-branding/logger';
import { doGetJSON } from '../../util/httpUtils';

/**
 * Fetches theme data from a URL and dispatches an action to apply it live.
 * This bypasses the run-once logic of fetchCustomBrandingData.
 *
 * @param {string | null} themeUrl - The URL of the new theme JSON. If null, branding will be reset.
 * @returns {Function} - A Redux thunk.
 */
export function changeTheme(themeUrl: string | null) {
    return async (dispatch: IStore['dispatch']) => {
        if (!themeUrl) {
            dispatch(setSelectedTheme({ url: null, content: null }));

            return;
        }

        try {
            const themeContent = await doGetJSON(themeUrl);

            dispatch(setSelectedTheme({ url: themeUrl, content: themeContent }));

        } catch (err) {
            logger.error('Failed to fetch and change theme:', err);
            dispatch(setDynamicBrandingFailed());
        }
    };
}
