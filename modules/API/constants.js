// XXX The function parseURLParams is exported by the feature base/config (as
// defined in the terminology of react/). However, this file is (very likely)
// bundled in external_api in addition to app.bundle and, consequently, it is
// best to import as little as possible here (rather than the whole feature
// base/config) in order to minimize the amount of source code bundled into
// multiple bundles.
import parseURLParams from '../../react/features/base/config/parseURLParams';

/**
 * JitsiMeetExternalAPI id - unique for a webpage.
 */
export const API_ID
    = parseURLParams(window.location).jitsi_meet_external_api_id;
