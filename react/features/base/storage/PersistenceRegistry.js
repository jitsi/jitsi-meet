// @flow

import Logger from 'jitsi-meet-logger';
import md5 from 'js-md5';

const logger = Logger.getLogger(__filename);

/**
 * The name of the localStorage store where the app persists its values to.
 */
const PERSISTED_STATE_NAME = 'jitsi-state';

/**
 * The type of the name-config pairs stored in this reducer.
 */
declare type PersistencyConfigMap = { [name: string]: Object };

/**
 * A registry to allow features to register their redux store subtree to be
 * persisted and also handles the persistency calls too.
 */
class PersistenceRegistry {
    _checksum: string;

    _elements: PersistencyConfigMap;

    /**
     * Initializes a new {@ code PersistenceRegistry} instance.
     */
    constructor() {
        this._elements = {};
    }

    /**
     * Returns the persisted redux state. This function takes the
     * {@link #_elements} into account as we may have persisted something in the
     * past that we don't want to retreive anymore. The next
     * {@link #persistState} will remove those values.
     *
     * @returns {Object}
     */
    getPersistedState() {
        let filteredPersistedState = {};
        let persistedState = window.localStorage.getItem(PERSISTED_STATE_NAME);

        if (persistedState) {
            try {
                persistedState = JSON.parse(persistedState);
            } catch (error) {
                logger.error(
                    'Error parsing persisted state',
                    persistedState,
                    error);
                persistedState = {};
            }

            filteredPersistedState
                = this._getFilteredState(persistedState);
        }

        this._checksum = this._calculateChecksum(filteredPersistedState);
        logger.info('redux state rehydrated as', filteredPersistedState);

        return filteredPersistedState;
    }

    /**
     * Initiates a persist operation, but its execution will depend on the
     * current checksums (checks changes).
     *
     * @param {Object} state - The redux state.
     * @returns {void}
     */
    persistState(state: Object) {
        const filteredState = this._getFilteredState(state);
        const newCheckSum = this._calculateChecksum(filteredState);

        if (newCheckSum !== this._checksum) {
            try {
                window.localStorage.setItem(
                    PERSISTED_STATE_NAME,
                    JSON.stringify(filteredState));
                logger.info(
                    `redux state persisted. ${this._checksum} -> ${
                        newCheckSum}`);
                this._checksum = newCheckSum;
            } catch (error) {
                logger.error('Error persisting redux state', error);
            }
        }
    }

    /**
     * Registers a new subtree config to be used for the persistency.
     *
     * @param {string} name - The name of the subtree the config belongs to.
     * @param {Object} config - The config object.
     * @returns {void}
     */
    register(name: string, config: Object) {
        this._elements[name] = config;
    }

    /**
     * Calculates the checksum of the current or the new values of the state.
     *
     * @private
     * @param {Object} filteredState - The filtered/persisted redux state.
     * @returns {string}
     */
    _calculateChecksum(filteredState: Object) {
        try {
            return md5.hex(JSON.stringify(filteredState) || '');
        } catch (error) {
            logger.error(
                'Error calculating checksum for state',
                filteredState,
                error);

            return '';
        }
    }

    /**
     * Prepares a filtered state from the actual or the persisted redux state,
     * based on this registry.
     *
     * @private
     * @param {Object} state - The actual or persisted redux state.
     * @returns {Object}
     */
    _getFilteredState(state: Object) {
        const filteredState = {};

        for (const name of Object.keys(this._elements)) {
            if (state[name]) {
                filteredState[name]
                    = this._getFilteredSubtree(
                        state[name],
                        this._elements[name]);
            }
        }

        return filteredState;
    }

    /**
     * Prepares a filtered subtree based on the config for persisting or for
     * retrieval.
     *
     * @private
     * @param {Object} subtree - The redux state subtree.
     * @param {Object} subtreeConfig - The related config.
     * @returns {Object}
     */
    _getFilteredSubtree(subtree, subtreeConfig) {
        const filteredSubtree = {};

        for (const persistedKey of Object.keys(subtree)) {
            if (subtreeConfig[persistedKey]) {
                filteredSubtree[persistedKey] = subtree[persistedKey];
            }
        }

        return filteredSubtree;
    }
}

export default new PersistenceRegistry();
