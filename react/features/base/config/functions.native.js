// @flow


export * from './functions.any';

/**
 * Removes all analytics related options from the given configuration, in case of a libre build.
 *
 * @param {*} config - The configuration which needs to be cleaned up.
 * @returns {void}
 */
export function _cleanupConfig(config: Object) {
    config.analytics.scriptURLs = [];
    delete config.analytics.amplitudeAPPKey; // always disable analytics
    delete config.analytics.googleAnalyticsTrackingId;
    delete config.callStatsID;
    delete config.callStatsSecret;
}
