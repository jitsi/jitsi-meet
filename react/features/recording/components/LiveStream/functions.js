// @flow

import {
    FOUR_GROUPS_DASH_SEPARATED,
    GOOGLE_PRIVACY_POLICY,
    JITSI_LIVE_STREAMING_HELP_LINK,
    YOUTUBE_TERMS_URL
} from './constants';

/**
 * Get the live streaming options.
 *
 * @param {Object} state - The global state.
 * @returns {LiveStreaming}
 */
export function getLiveStreaming(state: Object) {
    const { liveStreaming } = state['features/base/config'];
    const { helpLink, termsLink, dataPrivacyLink, validatorRegExpString } = liveStreaming || {};

    const regexpFromConfig = validatorRegExpString
        && new RegExp(validatorRegExpString);

    return {
        helpURL: helpLink || JITSI_LIVE_STREAMING_HELP_LINK,
        termsURL: termsLink || YOUTUBE_TERMS_URL,
        dataPrivacyURL: dataPrivacyLink || GOOGLE_PRIVACY_POLICY,
        streamLinkRegexp: regexpFromConfig || FOUR_GROUPS_DASH_SEPARATED
    };
}
