// XXX The function parseURLParams is exported by the feature base/util (as
// defined in the terminology of react/). However, this file is (very likely)
// bundled in external_api in addition to app.bundle and, consequently, it is
// best to import as little as possible here (rather than the whole feature
// base/util) in order to minimize the amount of source code bundled into
// multiple bundles.
import { parseURLParams } from '../../react/features/base/util/parseURLParams';

/**
 * JitsiMeetExternalAPI id - unique for a webpage.
 * TODO: This shouldn't be computed here.
 */
let _apiID;

try {
    _apiID = parseURLParams(window.location).jitsi_meet_external_api_id;
} catch (_) { /* Ignore. */ }

export const API_ID = _apiID;

/**
 * The payload name for the datachannel/endpoint text message event.
 */
export const ENDPOINT_TEXT_MESSAGE_NAME = 'endpoint-text-message';

/**
 * The min value that can be set for the assumed bandwidth.
 * Setting it to this value means not assuming any bandwidth,
 * but rather allowing the estimations to take place.
 */
export const MIN_ASSUMED_BANDWIDTH_BPS = -1;
