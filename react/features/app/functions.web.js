// @flow

export * from './functions.any';

declare var interfaceConfig: Object;

/**
 * Returns application name.
 *
 * @returns {string} The application name.
 */
export function getName() {
    return interfaceConfig.APP_NAME;
}
