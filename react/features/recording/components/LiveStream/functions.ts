import { IReduxState } from '../../../app/types';
import { sanitizeUrl } from '../../../base/util/uri';

import {
    GOOGLE_PRIVACY_POLICY,
    JITSI_LIVE_STREAMING_HELP_LINK,
    STREAM_KEY_OR_URL_REGEXP,
    YOUTUBE_TERMS_URL
} from './constants';

/**
 * Get the live streaming options.
 *
 * @param {Object} state - The global state.
 * @returns {LiveStreaming}
 */
export function getLiveStreaming(state: IReduxState) {
    const { liveStreaming = {}, googleApiApplicationClientID } = state['features/base/config'];
    const regexp = liveStreaming.validatorRegExpString && new RegExp(liveStreaming.validatorRegExpString);
    const hasGoogleApi = Boolean(googleApiApplicationClientID);

    return {
        enabled: Boolean(liveStreaming.enabled),
        helpURL: sanitizeUrl(liveStreaming.helpLink || JITSI_LIVE_STREAMING_HELP_LINK)?.toString(),
        termsURL: sanitizeUrl(liveStreaming.termsLink || (hasGoogleApi ? YOUTUBE_TERMS_URL : undefined))?.toString(),
        dataPrivacyURL: sanitizeUrl(liveStreaming.dataPrivacyLink
            || (hasGoogleApi ? GOOGLE_PRIVACY_POLICY : undefined))?.toString(),
        streamLinkRegexp: regexp || STREAM_KEY_OR_URL_REGEXP
    };
}
