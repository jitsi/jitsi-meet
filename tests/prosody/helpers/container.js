let _container;

/**
 * Stores the testcontainers container reference for use by test helpers.
 * Called by setup.js after the container starts.
 *
 * @param {object} c - The testcontainers container instance.
 */
export function setContainer(c) {
    _container = c;
}

/**
 * Returns the running testcontainers container.
 * Throws if setup.js has not run yet.
 *
 * @returns {object} The testcontainers container instance.
 */
export function getContainer() {
    if (!_container) {
        throw new Error('Container not initialised — is setup.js loaded?');
    }

    return _container;
}
