import { IReduxState } from '../../../app/types';
import { sanitizeUrl } from '../../../base/util/uri';

import {
    FOUR_GROUPS_DASH_SEPARATED,
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
    const hasCustomTerms = Boolean(liveStreaming.termsLink);
    const hasCustomPrivacy = Boolean(liveStreaming.dataPrivacyLink);

    return {
        dataPrivacyLabelKey: hasCustomPrivacy
            ? 'liveStreaming.privacyPolicy'
            : (hasGoogleApi ? 'liveStreaming.googlePrivacyPolicy' : 'liveStreaming.privacyPolicy'),
        dataPrivacyURL: sanitizeUrl(liveStreaming.dataPrivacyLink
            || (hasGoogleApi ? GOOGLE_PRIVACY_POLICY : undefined))?.toString(),
        enabled: Boolean(liveStreaming.enabled),
        helpURL: sanitizeUrl(liveStreaming.helpLink || JITSI_LIVE_STREAMING_HELP_LINK)?.toString(),
        streamKeyPlaceholderKey: hasGoogleApi
            ? 'liveStreaming.enterStreamKey'
            : 'liveStreaming.enterStreamKeyGeneric',
        streamLinkRegexp: regexp || (hasGoogleApi ? FOUR_GROUPS_DASH_SEPARATED : STREAM_KEY_OR_URL_REGEXP),
        termsLabelKey: hasCustomTerms
            ? 'liveStreaming.terms'
            : (hasGoogleApi ? 'liveStreaming.youtubeTerms' : 'liveStreaming.terms'),
        termsURL: sanitizeUrl(liveStreaming.termsLink || (hasGoogleApi ? YOUTUBE_TERMS_URL : undefined))?.toString()
    };
}
