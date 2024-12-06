import { IReduxState } from '../../../app/types';
import { sanitizeUrl } from '../../../base/util/uri';

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
export function getLiveStreaming(state: IReduxState) {
    const { liveStreaming = {} } = state['features/base/config'];
    const { liveStreamingDialogUrls = {} } = state['features/dynamic-branding'];
    const regexp = liveStreaming.validatorRegExpString && new RegExp(liveStreaming.validatorRegExpString);

    return {
        enabled: Boolean(liveStreaming.enabled),
        helpURL: sanitizeUrl(
            liveStreamingDialogUrls.helpUrl || liveStreaming.helpLink || JITSI_LIVE_STREAMING_HELP_LINK)?.toString(),
        termsURL: sanitizeUrl(
            liveStreamingDialogUrls.termsUrl || liveStreaming.termsLink || YOUTUBE_TERMS_URL)?.toString(),
        dataPrivacyURL: sanitizeUrl(
            liveStreamingDialogUrls.dataPrivacyUrl || liveStreaming.dataPrivacyLink || GOOGLE_PRIVACY_POLICY
        )?.toString(),
        streamLinkRegexp: regexp || FOUR_GROUPS_DASH_SEPARATED
    };
}
