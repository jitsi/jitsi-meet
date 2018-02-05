import { AsyncStorage } from 'react-native';

/**
 * A Web Sorage API implementation used for polyfilling
 * {@code window.localStorage} and/or {@code window.sessionStorage}.
 * <p>
 * The Web Storage API is synchronous whereas React Native's builtin generic
 * storage API {@code AsyncStorage} is asynchronous so the implementation with
 * persistence is optimistic: it will first store the value locally in memory so
 * that results can be served synchronously and then persist the value
 * asynchronously. If an asynchronous operation produces an error, it's ignored.
 */
export default class Storage {
    /**
     * Initializes a new {@code Storage} instance. Loads all previously
     * persisted data items from React Native's {@code AsyncStorage} if
     * necessary.
     *
     * @param {string|undefined} keyPrefix - The prefix of the
     * {@code AsyncStorage} keys to be persisted by this storage.
     */
    constructor(keyPrefix) {
        /**
         * The prefix of the {@code AsyncStorage} keys persisted by this
         * storage. If {@code undefined}, then the data items stored in this
         * storage will not be persisted.
         *
         * @private
         * @type {string}
         */
        this._keyPrefix = keyPrefix;

        // Perform optional asynchronous initialization.
        const initializing = this._initializeAsync();

        if (initializing) {
            // Indicate that asynchronous initialization is under way.
            this._initializing = initializing;

            // When the asynchronous initialization completes, indicate its
            // completion.
            initializing.finally(() => {
                if (this._initializing === initializing) {
                    this._initializing = undefined;
                }
            });
        }
    }

    /**
     * Removes all keys from this storage.
     *
     * @returns {void}
     */
    clear() {
        for (const key of Object.keys(this)) {
            this.removeItem(key);
        }
    }

    /**
     * Returns the value associated with a specific key in this storage.
     *
     * @param {string} key - The name of the key to retrieve the value of.
     * @returns {string|null} The value associated with {@code key} or
     * {@code null}.
     */
    getItem(key) {
        return this.hasOwnProperty(key) ? this[key] : null;
    }

    /**
     * Returns the value associated with a specific key in this {@code Storage}
     * in an async manner. The method is required for the cases where we need
     * the stored data but we're not sure yet whether this {@code Storage} is
     * already initialized (e.g. on app start).
     *
     * @param {string} key - The name of the key to retrieve the value of.
     * @returns {Promise}
     */
    _getItemAsync(key) {
        return (
            (this._initializing || Promise.resolve())
                .catch(() => { /* _getItemAsync should always resolve! */ })
                .then(() => this.getItem(key)));
    }

    /**
     * Performs asynchronous initialization of this {@code Storage} instance
     * such as loading all keys from {@link AsyncStorage}.
     *
     * @private
     * @returns {Promise}
     */
    _initializeAsync() {
        if (typeof this._keyPrefix !== 'undefined') {
            // Load all previously persisted data items from React Native's
            // AsyncStorage.

            return new Promise(resolve => {
                AsyncStorage.getAllKeys().then((...getAllKeysCallbackArgs) => {
                    // XXX The keys argument of getAllKeys' callback may or may
                    // not be preceded by an error argument.
                    const keys
                        = getAllKeysCallbackArgs[
                            getAllKeysCallbackArgs.length - 1
                        ].filter(key => key.startsWith(this._keyPrefix));

                    AsyncStorage.multiGet(keys)
                    .then((...multiGetCallbackArgs) => {
                        // XXX The result argument of multiGet may or may not be
                        // preceded by an errors argument.
                        const result
                            = multiGetCallbackArgs[
                                multiGetCallbackArgs.length - 1
                            ];
                        const keyPrefixLength
                            = this._keyPrefix && this._keyPrefix.length;

                        // eslint-disable-next-line prefer-const
                        for (let [ key, value ] of result) {
                            key = key.substring(keyPrefixLength);

                            // XXX The loading of the previously persisted data
                            // items from AsyncStorage is asynchronous which
                            // means that it is technically possible to invoke
                            // setItem with a key before the key is loaded from
                            // AsyncStorage.
                            if (!this.hasOwnProperty(key)) {
                                this[key] = value;
                            }
                        }

                        resolve();
                    });
                });
            });
        }

        return undefined;
    }

    /**
     * Returns the name of the nth key in this storage.
     *
     * @param {number} n - The zero-based integer index of the key to get the
     * name of.
     * @returns {string} The name of the nth key in this storage.
     */
    key(n) {
        const keys = Object.keys(this);

        return n < keys.length ? keys[n] : null;
    }

    /**
     * Returns an integer representing the number of data items stored in this
     * storage.
     *
     * @returns {number}
     */
    get length() {
        return Object.keys(this).length;
    }

    /**
     * Removes a specific key from this storage.
     *
     * @param {string} key - The name of the key to remove.
     * @returns {void}
     */
    removeItem(key) {
        delete this[key];
        typeof this._keyPrefix === 'undefined'
            || AsyncStorage.removeItem(`${String(this._keyPrefix)}${key}`);
    }

    /**
     * Adds a specific key to this storage and associates it with a specific
     * value. If the key exists already, updates its value.
     *
     * @param {string} key - The name of the key to add/update.
     * @param {string} value - The value to associate with {@code key}.
     * @returns {void}
     */
    setItem(key, value) {
        value = String(value); // eslint-disable-line no-param-reassign
        this[key] = value;
        typeof this._keyPrefix === 'undefined'
            || AsyncStorage.setItem(`${String(this._keyPrefix)}${key}`, value);
    }
}
