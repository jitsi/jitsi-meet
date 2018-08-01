// @flow
declare var interfaceConfig: Object;

/**
 * Everything about recent list on web should be behind a feature flag and in
 * order to share code, this alias for the feature flag on mobile is set to the
 * value defined in interface_config
 * @type {boolean}
 */
export const { RECENT_LIST_ENABLED } = interfaceConfig;
