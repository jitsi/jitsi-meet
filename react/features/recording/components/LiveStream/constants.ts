/**
 * The URL for Google Privacy Policy.
 */
export const GOOGLE_PRIVACY_POLICY = 'https://policies.google.com/privacy';

/**
 * The URL that is the main landing page for YouTube live streaming and should
 * have a user's live stream key.
 */
export const YOUTUBE_LIVE_DASHBOARD_URL = 'https://www.youtube.com/live_dashboard';

/**
 * The URL for YouTube terms and conditions.
 */
export const YOUTUBE_TERMS_URL = 'https://www.youtube.com/t/terms';

/**
 * The live streaming help link to display.
 */
export const JITSI_LIVE_STREAMING_HELP_LINK = 'https://jitsi.org/live';

/**
 *  The YouTube stream link RegExp.
 */
export const FOUR_GROUPS_DASH_SEPARATED = /^(?:[a-zA-Z0-9]{4}(?:-(?!$)|$)){4}/;

/**
 * Default stream key or RTMP/RTMPS URL RegExp.
 * Accepts:
 * - RTMP/RTMPS URLs (e.g. rtmp://domain.com/live/key, rtmps://...)
 * - YouTube 4-group keys (e.g. abcd-1234-efgh-5678)
 * - Generic alphanumeric stream keys with dashes or underscores.
 */
export const STREAM_KEY_OR_URL_REGEXP = /^(?:rtmps?:\/\/\S+|(?:[a-zA-Z0-9]{4}(?:-(?!$)|$)){4}|[a-zA-Z0-9_\-]+)$/;

