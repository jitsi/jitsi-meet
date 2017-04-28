declare var getConfigParamsFromUrl: Function;

/**
 * JitsiMeetExternalAPI id - unique for a webpage.
 */
export const API_ID
    = typeof getConfigParamsFromUrl === 'function'
        ? getConfigParamsFromUrl().jitsi_meet_external_api_id : undefined;
