// @flow

import Logger from 'jitsi-meet-logger';
import md5 from 'js-md5';

const logger = Logger.getLogger(__filename);

/**
 * The name of the localStorage store where the app persists its values to.
 */
const PERSISTED_STATE_NAME = 'jitsi-state';

/**
 * Mixed type of the element (subtree) config. If it's a boolean,
 * (and is true) we persist the entire subtree. If it's an object,
 * we perist a filtered subtree based on the properties in the
 * config object.
 */
declare type ElementConfig = Object | boolean;

/**
 * The type of the name-config pairs stored in this reducer.
 */
declare type PersistencyConfigMap = { [name: string]: ElementConfig };

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
            // This is the legacy implementation,
            // must be removed in a later version.
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

            // legacy values must be written to the new store format and
            // old values to be deleted, so then it'll never be used again.
            this.persistState(filteredPersistedState);
            window.localStorage.removeItem(PERSISTED_STATE_NAME);
        } else {
            // new, split-keys implementation
            for (const subtreeName of Object.keys(this._elements)) {
                /*
                 * this assumes that the persisted value is stored under the
                 * same key as the feature's redux state name.
                 * We'll need to introduce functions later that can control
                 * the persist key's name. Similar to control serialization
                 * and deserialization.
                 * But that should be a straightforward change.
                 */
                const persistedSubtree
                    = this._getPersistedSubtree(
                        subtreeName,
                        this._elements[subtreeName]
                    );

                if (persistedSubtree !== undefined) {
                    filteredPersistedState[subtreeName] = persistedSubtree;
                }
            }
        }

        // initialize checksum
        this._checksum = this._calculateChecksum(filteredPersistedState);

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
            for (const subtreeName of Object.keys(filteredState)) {
                try {
                    window.localStorage.setItem(
                        subtreeName,
                        JSON.stringify(filteredState[subtreeName]));
                } catch (error) {
                    logger.error('Error persisting redux subtree',
                        subtreeName,
                        filteredState[subtreeName],
                        error
                    );
                }
            }
            logger.info(
                `redux state persisted. ${this._checksum} -> ${
                    newCheckSum}`);
            this._checksum = newCheckSum;
        }
    }

    /**
     * Registers a new subtree config to be used for the persistency.
     *
     * @param {string} name - The name of the subtree the config belongs to.
     * @param {ElementConfig} config - The config object, or boolean
     * if the entire subtree needs to be persisted.
     * @returns {void}
     */
    register(name: string, config?: ElementConfig = true) {
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
     * Retreives a persisted subtree from the storage.
     *
     * @private
     * @param {string} subtreeName - The name of the subtree.
     * @param {Object} subtreeConfig - The config of the subtree
     * from this._elements.
     * @returns {Object}
     */
    _getPersistedSubtree(subtreeName, subtreeConfig) {
        let persistedSubtree = window.localStorage.getItem(subtreeName);

        if (persistedSubtree) {
            try {
                persistedSubtree = JSON.parse(persistedSubtree);
                const filteredSubtree
                    = this._getFilteredSubtree(persistedSubtree, subtreeConfig);

                if (filteredSubtree !== undefined) {
                    return filteredSubtree;
                }
            } catch (error) {
                logger.error(
                    'Error parsing persisted subtree',
                    subtreeName,
                    persistedSubtree,
                    error);
            }
        }

        return null;
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
                filteredState[name] = this._getFilteredSubtree(
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
     * @param {ElementConfig} subtreeConfig - The related config.
     * @returns {Object}
     */
    _getFilteredSubtree(subtree, subtreeConfig) {
        let filteredSubtree;

        if (subtreeConfig === true) {
            // we persist the entire subtree
            filteredSubtree = subtree;
        } else if (typeof subtreeConfig === 'object') {
            // only a filtered subtree gets persisted, based on the
            // subtreeConfig object.
            filteredSubtree = {};
            for (const persistedKey of Object.keys(subtree)) {
                if (subtreeConfig[persistedKey]) {
                    filteredSubtree[persistedKey] = subtree[persistedKey];
                }
            }
        }

        return filteredSubtree;
    }
}

export default new PersistenceRegistry();
